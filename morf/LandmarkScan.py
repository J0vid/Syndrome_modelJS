import sys
sys.path.append('../')
import cv2
import vtk
import numpy as np
import face_recognition as fr
import json
from vtk.util.numpy_support import vtk_to_numpy, numpy_to_vtk
import random

# from ..morf import landmark as lm
from morf import utils
from morf import alignment
from morf import io
from morf import registration

import argparse

# file paths:
parser = argparse.ArgumentParser(description = "Generates 24 facial landmarks for initial alignment in registration algorithms.",
                                 formatter_class = argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument("-i", "--input_path", help="input mesh", default = None)
parser.add_argument("-o", "--output_path", help="output directory for lms", default = None)
parser.add_argument("-t", "--texture", help="input texture (if applicable)", default= None)
parser.add_argument("-d", "--debug", help="enable plotting for local testing", default= False)
parser.add_argument("-c", "--camera", help="what camera was used?", default= None)


args = parser.parse_args()
config = vars(args)

filename = args.input_path

landmark_dir = args.output_path

if args.debug is True:
    _image_size = 500
else:
    from xvfbwrapper import Xvfb
    _image_size = 224
_face_distance = 800
_landmark_ids = [36,39,27,42,45,28,29,30,33,60,51,64,57]
# _landmark_ids = [36,48,56,57,58]

class Scene:
    def __init__(self, mesh, camera_position, focal_point, view_angle, image_size, view_up = (0,1,0)):
        self.graphics = vtk.vtkGraphicsFactory()
        self.graphics.SetUseMesaClasses(1)
        self.graphics.SetOffScreenOnlyMode(1)

        self.mesh = mesh[0]
        self.image_size = image_size

        self.mapper = vtk.vtkPolyDataMapper()
        self.mapper.SetInputData(self.mesh)

        self.actor = vtk.vtkActor()
        # if args.camera == "Einstar" or args.camera == "einstar":
        #     self.actor.RotateX(180)
        #     self.actor.RotateZ(-90)
        self.actor.SetMapper(self.mapper)

        if args.texture is not None:
            self.actor.GetProperty().SetTexture("t1", mesh[1])
            
        self.camera = vtk.vtkCamera()

        self.renderer = vtk.vtkRenderer()
        self.renderer.SetActiveCamera(self.camera)
        self.renderer.AddActor(self.actor)
        self.renderer.SetBackground(0,0,0)

        self.render_window = vtk.vtkRenderWindow()
        self.render_window.SetOffScreenRendering(True)
        self.render_window.AddRenderer(self.renderer)

        self.interactor = vtk.vtkRenderWindowInteractor()
        self.interactor.SetRenderWindow(self.render_window)

        self.picker = vtk.vtkCellPicker()
        self.picker.SetTolerance(0.05)
        self.interactor.SetPicker(self.picker)

        self.render_window.SetSize(self.image_size, self.image_size)
        self.camera.SetPosition(camera_position[0], camera_position[1], camera_position[2])
        self.camera.SetFocalPoint(focal_point[0], focal_point[1], focal_point[2])
        self.camera.SetViewUp(view_up)
        self.camera.OrthogonalizeViewUp()
        self.camera.SetViewAngle(view_angle)

        self.image_filter = vtk.vtkWindowToImageFilter()
        self.image_filter.SetInput(self.render_window)


    def render(self):
        
        self.interactor.Initialize()
        # self.render_window.Render()
        # self.interactor.Start()


    def captureImage(self):
        self.render_window.Render()
        self.image_filter.Update()
        out_writer = vtk.vtkPNGWriter()
        out_writer.SetInputData(self.image_filter.GetOutput())
        out_writer.SetFileName("/tmp/debugimage.png")
        out_writer.Write()
        return utils.vtkImage_to_np(self.image_filter.GetOutput())


    def pickPoint(self, point_2d):
        self.render_window.Render()

        # the second axis of the image is flipped...
        point_2d = (point_2d[0], (self.image_size - point_2d[1]))

        self.picker.Pick(point_2d[0], point_2d[1], 0, self.renderer)
        point_id = self.picker.GetPointId()
        # print(point_2d)
        # print(point_id)

        if point_id >=0 and point_id < self.mesh.GetNumberOfPoints():
            point_3d = self.mesh.GetPoints().GetPoint(point_id)
        else:
            point_3d = None

        return point_3d

    def pickVert(self, point_2d):
            self.render_window.Render()

            # the second axis of the image is flipped...
            point_2d = (point_2d[0], (self.image_size - point_2d[1]))

            self.picker.Pick(point_2d[0], point_2d[1], 0, self.renderer)
            point_id = self.picker.GetPointId()
            
            return point_id
 
def identify_3D_landmarks(mesh):
    """
    Returns a set of 3D facial landmarks on the mesh

    :param mesh: vtkPolyData polygonal mesh
    :return: A np array of 3D points
    """

    # Find the coarse facial orientation in 3D
    c = alignment.compute_mesh_centroid(mesh[0])
    # print("centroid: ", c)
    # print(_compute_centroid_size(mesh[0]))
    
    d = 600
    camera_positions = [
        (c[0], c[1], c[2] + (d * .65)),
        (c[0], c[1], c[2] - (d * .65)),
        (c[0], c[1] + (d * .5), c[2] + (d * .75)),
        (c[0] + (d * .5), c[1] + (d * .35), c[2] + (d * .75)),
        (c[0], c[1] - (d * .25), c[2] + (d * .75)),
        (c[0] - (d * .5), c[1], c[2] + (d * .75)),
        (c[0] + (d * 1.2), c[1] + (d * .35), c[2] + (d * .75)),
        (c[0] - (d * 1.2), c[1], c[2] + (d * .75)),
         (c[0] + (d * 1.2), c[1] + (d * .85), c[2] - (d * 1)),
        (c[0] - (d * 1.2), c[1], c[2] - (d * 1))
    ]

    landmarks_3d = None
    for position in camera_positions:
        scene = Scene(mesh, position, c, 50, image_size= _image_size)
        image = scene.captureImage()

        print("camera position: ", position)
        if args.debug is True:
                cv2.imshow("test", image)
                cv2.waitKey(0) 

        if len(fr.face_landmarks(image)) > 0: 
            print("Face Located")
              
            landmarks_2d = identify_2D_landmarks(image)

            if args.debug is True:
                utils.check_landmarks_2d(image, landmarks_2d)  
         
            landmarks_3d = [scene.pickPoint(point_2d) for point_2d in landmarks_2d]
            # _check_landmarks_3d(mesh[0], landmarks_3d)
            break

    if landmarks_3d == None:
        print("Face wasn't found from any perspective!")
        return

    # recompute the camera position for better landmarks
    for i in range(2):
        # print(i, "beeesh")
        focal_point, camera_position, view_up = utils.compute_frontal_camera_settings(landmarks_3d, 850)
        camera_position[2] = camera_position[2]
        scene2 = Scene(mesh, camera_position, focal_point, 20, image_size= _image_size, view_up = view_up)
        image = scene2.captureImage()

        #fucking really, face_recognition?!?
        image = cv2.imread("/tmp/debugimage.png")
 
        landmarks_2d = identify_2D_landmarks(image)
        
        landmarks_3d = [scene2.pickPoint(point_2d) for point_2d in landmarks_2d]
        landmarks_verts = [scene2.pickVert(point_2d) for point_2d in landmarks_2d]

        if args.debug is True:
            utils.check_landmarks_2d(image, landmarks_2d)
        #   utils.check_landmarks_3d(mesh[0], landmarks_3d)
    return [landmarks_3d[x] for x in _landmark_ids], [landmarks_verts[x] for x in _landmark_ids]


def identify_2D_landmarks(image):
    landmarks = fr.face_landmarks(image)[0]

    # unpack from the dictionary into the right order...
    landmark_list = landmarks['chin'] + landmarks['left_eyebrow'] + \
        landmarks['right_eyebrow'] + landmarks['nose_bridge'] + \
        landmarks['nose_tip'] + landmarks['left_eye'] + landmarks['right_eye'] + \
        landmarks['top_lip'][:-5] + landmarks['bottom_lip'][1:-6] + \
        landmarks['top_lip'][:-5:-1] + landmarks['bottom_lip'][:-5:-1]

    return landmark_list   


if args.debug is False:
    display = Xvfb()
    display.start()

# print(filename)
infile = filename
outfile = landmark_dir + ".txt"
outfile_mesh = landmark_dir + ".ply"
# mesh = io.read_obj_morf(infile, args.camera, args.texture)
mesh = io.read_mesh_vtk(infile, args.texture, args.camera, scale = True)

landmarks = identify_3D_landmarks(mesh)

atlas_mesh_file = '../morf/data/atlas.ply'
atlas_landmark_file = '../morf/data/atlas_picked_points.txt' #/mnt/c/Users/David A/Documents/dsai_stuff/3d-utilities/autoLM/src/examples/

atlas_mesh = io.read_mesh_vtk(atlas_mesh_file, scale = False)
atlas_landmarks = io.read_landmarks(atlas_landmark_file)

registered_mesh, registered_lms = alignment.affine_alignment(mesh[4], landmarks[0], atlas_landmarks)

#JB nrICP
# atlas_mesh, atlas_landmarks = alignment.affine_alignment(atlas_mesh[4], atlas_landmarks, landmarks[0])
# atlas_mesh = registration.spline(atlas_mesh, atlas_landmarks, landmarks[0])

# print("time to register motherfuckerrrr")
# registered_mesh = registration.non_rigid_icp(
#         atlas_mesh, 
#         mesh[4],
#         max_stiffness=150,
#         min_stiffness=50,
#         max_iterations=50
#         )

io.write_mesh_vtk(registered_mesh, outfile_mesh)
io.save_landmarks(mesh[2], registered_lms, outfile)

if args.debug is False:
    display.stop()