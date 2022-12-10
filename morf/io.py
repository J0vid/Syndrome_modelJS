from morf import utils
from morf import alignment

import vtk
import numpy as np
from vtk.util.numpy_support import vtk_to_numpy, numpy_to_vtk
from scipy.spatial.transform import Rotation as R

def read_mesh_vtk(filename, texture = None, camera = None, scale = None):
    file_type = filename[-3:]
    print(file_type)

    obj_file_suffix = []

    # for line in open(filename, "r"):
    #     if line.startswith('#'): continue
    #     if line.startswith('vn'): continue
    #     if line.startswith('vt') or line.startswith('f'):
    #         obj_file_suffix.append(line)

    f_index = len(obj_file_suffix)
    # print(obj_file_suffix[int(f_index - 1)].split("/"))
    quad_or_tri = [] #len(obj_file_suffix[int(f_index - 1)].split("/"))

    if file_type == 'ply':
        reader = vtk.vtkPLYReader()
        
    elif file_type == 'obj' or file_type == 'OBJ':
        reader = vtk.vtkOBJReader()
        if texture is not None:
            tReader = vtk.vtkJPEGReader()
            tReader.SetFileName(texture)

            texture = vtk.vtkTexture()
            texture.SetInputConnection(tReader.GetOutputPort())

    elif file_type == 'stl':
        reader = vtk.vtkSTLReader()
        
    elif file_type == 'vtk':
        reader = vtk.vtkPolyDataReader()

    else:
        print("Only ply, obj, vtk, or stl file types are supported")
        return 

    reader.SetFileName(filename)
    reader.Update()
    transform = vtk.vtkTransform()
    # print(reader.GetOutput())
    cSize = alignment.compute_mesh_centroid_size(reader.GetOutput())
    # scale to be around the size of jordan's mesh
    if scale == True:
        transform.Scale((174/cSize,174/cSize,174/cSize))
    else:
        transform.Scale(1,1,1)
    if camera == "Einstar" or camera == "einstar":
        transform.RotateX(180)
        transform.RotateZ(-90)
    scaleFactor = cSize/174
    transformFilter = vtk.vtkTransformPolyDataFilter()
    transformFilter.SetInputConnection(reader.GetOutputPort())
    transformFilter.SetTransform(transform)
    transformFilter.Update()


    # print(transformFilter.GetOutput())
    # print(reader.GetOutput())
    smoothMesh = utils.clean_mesh(transformFilter.GetOutput())
    decMesh = utils.decimate_mesh(smoothMesh)
    return decMesh, texture, scaleFactor, obj_file_suffix, smoothMesh, quad_or_tri


def read_obj_morf(filename, camera = None, texture = None):
    verts = []
    faces = []
    texcoords = []
    obj_file_suffix = []

    for line in open(filename, "r"):
        if line.startswith('#'): continue
        if line.startswith('vn'): continue
        if line.startswith('vt') or line.startswith('f'):
            obj_file_suffix.append(line)

        values = line.split()
        if not values: continue
            
        # Vertices
        if values[0] == 'v':
            v = list(map(float, values[1:4]))
            verts.append(v)

        # Faces
        elif values[0] == 'f':
            face = []
            for v in values[1:]:
                w = v.split('/')
                print(w)
                face.append(int(w[0]))
            faces.append(face)

        elif values[0] == 'vt':
            # print(values)
            v = list(map(float, values[1:3]))
            texcoords.append(v)

    verts = np.array(verts)
    faces = np.array(faces) - 1 #obj format indexes from 1
    texcoords = np.array(texcoords)
    print(texcoords.shape)
    print(verts.shape)
    # print(texcoords)

    mesh = utils.np_to_vtkPolyData(verts, faces)
    
    cSize = alignment.compute_mesh_centroid_size(mesh)
    # print("point csize: ", cSize)

    # scale to be around the size of jordan's mesh
    verts = verts * (174/cSize)

    if camera == "Einstar":
        r = R.from_euler('xyz', [[-180, 0,90]], degrees = True)
        verts = r.apply(verts)
    
    if texture is not None:
        tReader = vtk.vtkJPEGReader()
        tReader.SetFileName(texture)

        vtkTexture = vtk.vtkTexture()
        vtkTexture.SetInputConnection(tReader.GetOutputPort())  
        
    mesh = utils.np_to_vtkPolyData(verts, faces)
    mesh.GetPointData().SetTCoords(utils.np_to_vtkData(texcoords))

    return mesh, verts, faces, obj_file_suffix, vtkTexture


def write_mesh_vtk(mesh, filename):
    
    filename = filename[:-3] + 'obj'
    print(filename)
    file_type = filename[-3:]
    file_type = 'obj'

    if file_type == 'obj' or  file_type == 'OBJ':
        saver = vtk.vtkOBJWriter()
        # saver.SetInput (.renwin)
        # saver.SetFilePrefix(filename)
        # saver.Write()

    elif file_type == 'ply':
        saver = vtk.vtkPLYWriter()
        
    elif file_type == 'vtk':
        saver = vtk.vtkPolyDataWriter()

    else:
        print("Only obj, ply, and vtk file types are supported")
        return
    
    saver.SetInputData(mesh)
    saver.SetFileName(filename)
    saver.Update()


def write_obj_morf(filename, verts, obj_file_suffix):
   
    with open(filename, 'w') as f:
        for i in range(len(verts)):#range(verts.shape[0]):
            f.write("v {:.6f} {:.6f} {:.6f}\n".format(verts[i][0], verts[i][1], verts[i][2]))
            # f.write("v {:.6f} {:.6f} {:.6f}\n".format(verts[i, 0], verts[i, 1], verts[i, 2]))

        for i in obj_file_suffix:
            f.write(i)

def read_landmarks(filename):
    return np.loadtxt(filename)



def save_landmarks(scaleFactor, landmarks, filename):
    
    landmarks = np.array(landmarks) * scaleFactor
    np.savetxt(filename, landmarks)