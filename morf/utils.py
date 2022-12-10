import vtk
from vtk.util.numpy_support import vtk_to_numpy
import numpy as np
import cv2


def clean_mesh(mesh):
    cleaner = vtk.vtkCleanPolyData()
    cleaner.SetInputData(mesh)
    cleaner.Update()
    return cleaner.GetOutput()

def decimate_mesh(mesh, verbose = False):
    ncoords = mesh.GetNumberOfPoints()
    if verbose:
        print(ncoords)
    decimate = vtk.vtkDecimatePro()
    decimate.SetInputData(mesh)
    #will segfault if ncoords < 20k
    if ncoords > 20000:
        decimate.SetTargetReduction(20000/ncoords)
        decimate.Update()
        return decimate.GetOutput()
    else:
        # decimate.SetTargetReduction(.25)
        # decimate.Update()
        return mesh

# def np_to_vtkPoints(np_verts):
#     vtk_points = vtk.vtkPoints()
#     for i in range(np_verts.shape[0]):
#         vtk_points.InsertNextPoint(
#                 np_verts[i,0], 
#                 np_verts[i,1], 
#                 np_verts[i,2])
#     return vtk_points


def np_to_vtkPoints(points):
    vtk_points = vtk.vtkPoints()
    for point in points:
        vtk_points.InsertNextPoint(point[0], point[1], point[2])
    vtk_points.Modified()
    return vtk_points


def vtkPoints_to_np(points):
    return vtk.util.numpy_support.vtk_to_numpy(points.GetData())

def np_to_vtkData(np_data):
    return vtk.util.numpy_support.numpy_to_vtk(num_array = np_data, deep = True, array_type = vtk.VTK_FLOAT)


def np_to_vtkCellArray(np_faces):
    vtk_polys = vtk.vtkCellArray()
    for i in range(np_faces.shape[0]):
        quad = vtk.vtkTriangle()
        quad.GetPointIds().SetId(0,np_faces[i,0])
        quad.GetPointIds().SetId(1,np_faces[i,1])
        quad.GetPointIds().SetId(2,np_faces[i,2])
        # quad.GetPointIds().SetId(3,np_faces[i,3])
        vtk_polys.InsertNextCell(quad)

    return vtk_polys


def np_to_vtkPolyData(np_verts, np_faces=None):
    polydata = vtk.vtkPolyData()
    polydata.SetPoints(np_to_vtkPoints(np_verts))
    if np_faces is not None:
        polydata.SetPolys(np_to_vtkCellArray(np_faces))
    return polydata
    
    
def vtkPolyData_to_np(polydata):
    return vtk_to_numpy(polydata.GetPoints().GetData()).reshape((-1,3))


def vtkImage_to_np(image):
    rows, cols, _ = image.GetDimensions()
    scalars = image.GetPointData().GetScalars()

    np_array = vtk_to_numpy(scalars)
    np_array = np_array.reshape(rows, cols, -1)

    # vtk and cv2 use different colorspaces...
    red, green, blue = np.dsplit(np_array, np_array.shape[-1])
    np_array = np.stack([blue, green, red], 2).squeeze()

    # the first axis of the image is also flipped...
    np_array = np.flip(np_array, 0)

    return np_array


def closest_vertex_projection(atlas_landmarks, atlas_mesh):
    point_locator = vtk.vtkPointLocator()
    point_locator.SetDataSet(atlas_mesh)
    point_locator.BuildLocator()

    n_points = atlas_landmarks.shape[0]
    vertex_ids = np.zeros(n_points)
    for i in range(n_points):
        point = atlas_landmarks[i, :]
        cp_id = point_locator.FindClosestPoint(point)
        vertex_ids[i] = cp_id

    return vertex_ids.astype(np.int32)

 #3D utils
def check_landmarks_2d(image, landmarks_2d=None):
    image = image.copy()

    if landmarks_2d:
        for point_2d in landmarks_2d:
            cv2.circle(image, point_2d, 2, (255,255,0))

    cv2.imshow('im', image)
    cv2.waitKey(0)
    # cv2.destroyAllWindows()


def check_landmarks_3d(mesh, landmarks_3d):
    points = np_to_vtkPoints(landmarks_3d)

    landmarks = vtk.vtkPolyData()
    landmarks.SetPoints(points)

    sphere = vtk.vtkSphereSource()
    sphere.SetRadius(2.5)

    glyph = vtk.vtkGlyph3D()
    glyph.SetSourceConnection(sphere.GetOutputPort())
    glyph.SetInputData(landmarks)

    sphere_mapper = vtk.vtkPolyDataMapper()
    sphere_mapper.SetInputConnection(glyph.GetOutputPort())

    sphere_actor = vtk.vtkActor()
    sphere_actor.SetMapper(sphere_mapper)

    mapper = vtk.vtkPolyDataMapper()
    mapper.SetInputData(mesh)

    actor = vtk.vtkActor()
    actor.SetMapper(mapper)

    renderer = vtk.vtkRenderer()
    renderer.AddActor(actor)
    renderer.AddActor(sphere_actor)

    render_window = vtk.vtkRenderWindow()
    render_window.AddRenderer(renderer)

    renderWindowInteractor = vtk.vtkRenderWindowInteractor()
    renderWindowInteractor.SetRenderWindow(render_window)
    renderWindowInteractor.Initialize()

    render_window.Render()
    renderWindowInteractor.Start()


def compute_frontal_camera_settings(landmarks, face_distance):
    nose_bridge = np.asarray(landmarks[27])
    nose_tip = np.asarray(landmarks[30])
    left_eye = np.asarray(landmarks[45])
    left_lip = np.asarray(landmarks[54])
    right_eye = np.asarray(landmarks[36])
    right_lip = np.asarray(landmarks[48])
    ls = np.asarray(landmarks[51])


    v1 = np.subtract(right_lip, left_eye)
    v2 = np.subtract(left_lip, right_eye)

    direction = np.cross(v1, v2)
    direction = direction / np.linalg.norm(direction)

    focal_point = nose_tip
    camera_position = nose_tip + face_distance * direction
    view_up = nose_bridge - ls

    return focal_point, camera_position, view_up
   
def compute_centroid(mesh):
    com = vtk.vtkCenterOfMass()
    com.SetInputData(mesh)
    com.Update()

    return com.GetCenter()


def triangulate_mesh(mesh):
    triangulator = vtk.vtkTriangleFilter()
    triangulator.SetInputData(mesh)
    triangulator.Update()
    return triangulator.GetOutput()

def connect_mesh_filter(mesh):
    connect_filter = vtk.vtkPolyDataConnectivityFilter()
    connect_filter.SetInputData(mesh)
    connect_filter.SetExtractionModeToLargestRegion()
    connect_filter.Update()
    return connect_filter.GetOutput()


def extract_connections(mesh):
    edges = vtk.vtkExtractEdges()
    edges.SetInputData(mesh)
    edges.Update()
    lines = edges.GetOutput().GetLines()

    connections = []
    ids = vtk.vtkIdList()

    lines.InitTraversal()
    while lines.GetNextCell(ids):
        connections.append((ids.GetId(0), ids.GetId(1)))

    return connections
