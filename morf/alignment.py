from morf import utils
import numpy as np
import vtk


def align_mesh(source_mesh, source_lms, target_lms, alignment_type="rigid"):
   
    src_align_points = utils.np_to_vtkPoints(source_lms)
    tar_align_points = utils.np_to_vtkPoints(target_lms)
   
    if alignment_type == "rigid":
        transform = vtk.vtkLandmarkTransform()
        transform.SetSourceLandmarks(src_align_points)
        transform.SetTargetLandmarks(tar_align_points)
        # transform.SetModeToRigidBody()
        transform.Update()

    elif alignment_type == "similarity":
        transform = vtk.vtkLandmarkTransform()
        transform.SetSourceLandmarks(src_align_points)
        transform.SetTargetLandmarks(tar_align_points)
        transform.SetModeToSimilarity()
        transform.Update()

    elif alignment_type == "tps":
        transform = vtk.vtkThinPlateSplineTransform()
        transform.SetTargetLandmarks(src_align_points)
        transform.SetSourceLandmarks(tar_align_points)
        transform.SetSigma(100.)
        transform.SetBasisToR()
        transform.Inverse()
        transform.Update()
        
    else:
        raise ValueError('An invalid alignment type was selected. Only rigid, similarity and tps are supported')  

    transform_filter = vtk.vtkTransformPolyDataFilter()
    transform_filter.SetInputData(source_mesh)
    transform_filter.SetTransform(transform)
    transform_filter.Update()
    transformed_polydata = utils.vtkPoints_to_np(transform_filter.GetOutput().GetPoints())

    return transformed_polydata
    
def centroid_size(mesh, ids=None, verbose = False):
    verts = utils.vtkPolyData_to_np(mesh)
    if ids is not None:
        verts = verts[ids, :]

    verts = verts - np.mean(verts, axis=0)
    cs = np.sqrt(np.sum(np.square(verts)))
    if verbose:
        print("centroid size: ", cs)
        print("nverts: ", verts.shape)
    return cs


def centroid_size_scaling(mesh, target_cs, ids=None):
    cs = centroid_size(mesh, ids=ids)
    scale_factor = target_cs / cs

    transform = vtk.vtkTransform()
    transform.Scale((scale_factor, scale_factor, scale_factor))

    filter = vtk.vtkTransformPolyDataFilter()
    filter.SetInputData(mesh)
    filter.SetTransform(transform)
    filter.Update()
    scaled_mesh = filter.GetOutput()

    return scaled_mesh


def compute_mesh_centroid(mesh):
    # print(mesh.shape)
    com = vtk.vtkCenterOfMass()
    com.SetInputData(mesh)
    com.Update()

    return com.GetCenter()


def compute_mesh_centroid_size(mesh, verbose = False):
        coords = mesh.GetPoints().GetData()
        ncoords = vtk.util.numpy_support.vtk_to_numpy(coords)
        
        centroid = compute_mesh_centroid(mesh)
        results = 0

        for vertices in ncoords:
            row = np.sum(np.sqrt((vertices - centroid)**2))
            results +=  row
        results = results/ncoords.shape[0] 
        if verbose:
            print("csize: ", results)   
        return results

def affine_alignment(source_mesh, source_landmarks, target_landmarks):
    """
    Applies an affine transformation to the source mesh and landmarks
    :param source_mesh: vtkPolyData to be transformed
    :param source_landmarks: array of shape [n,3]
    :param target_landmarks: array of shape [n,3]
    :return: (transformed source_mesh, transformed source_landmarks)
    """
    tar = utils.np_to_vtkPoints(target_landmarks)
    src = utils.np_to_vtkPoints(source_landmarks)

    src_poly = vtk.vtkPolyData()
    src_poly.SetPoints(src)

    affine = vtk.vtkLandmarkTransform()
    # affine = vtk.ProcrustesAlignmentFilter()
    affine.SetSourceLandmarks(src)
    affine.SetTargetLandmarks(tar)
    # affine.SetModeToAffine()
    affine.Update()

    transform_mesh = vtk.vtkTransformPolyDataFilter()
    transform_mesh.SetTransform(affine)
    transform_mesh.SetInputData(source_mesh)
    transform_mesh.Update()
    transformed_mesh = transform_mesh.GetOutput()
    # if mesh_or_points == "points":
    #     transformed_mesh = utils.vtkPoints_to_np(transform_mesh.GetOutput().GetPoints())

    transform_landmarks = vtk.vtkTransformPolyDataFilter()
    transform_landmarks.SetTransform(affine)
    transform_landmarks.SetInputData(src_poly)
    transform_landmarks.Update()
    transformed_landmarks = utils.vtkPoints_to_np(transform_landmarks.GetOutput().GetPoints())

    return (transformed_mesh, transformed_landmarks)