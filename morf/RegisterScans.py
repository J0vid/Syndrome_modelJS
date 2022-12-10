import sys
sys.path.append('../')
import os
from morf import utils
from morf import io
from morf import registration
from morf import alignment

import argparse

# file paths:
parser = argparse.ArgumentParser(description = "Generates 24 facial landmarks for initial alignment in registration algorithms.",
                                 formatter_class = argparse.ArgumentDefaultsHelpFormatter)

parser.add_argument("-i", "--input_path", help="input mesh", default = None)
parser.add_argument("-l", "--landmark_path", help="input landmarks", default = None)
parser.add_argument("-o", "--output_path", help="output directory for lms", default = None)
parser.add_argument("-d", "--debug", help="enable plotting for local testing", default= False)

atlas_mesh_file = 'data/WrapHead.obj'
atlas_landmark_file = 'data/dockertest_template.txt'

mesh_file = "out/sb_test.obj" #args.input_path
landmark_file = "out/sb_test.txt" #args.landmark_path
out_file = "out/registered"

atlas_mesh = io.read_mesh_vtk(atlas_mesh_file)
atlas_landmarks = io.read_landmarks(atlas_landmark_file)

mesh = io.read_mesh_vtk(mesh_file)
landmarks = io.read_landmarks(landmark_file)

utils.check_landmarks_3d(mesh[4], landmarks)
# Registration
atlas_mesh, atlas_landmarks = alignment.affine_alignment(atlas_mesh[4], atlas_landmarks, landmarks)
atlas_mesh = registration.spline(atlas_mesh, atlas_landmarks, landmarks)

print("time to register motherfuckerrrr")
registered_mesh = registration.non_rigid_icp(
        atlas_mesh, 
        mesh[4],
        max_stiffness=10000,
        min_stiffness=50,
        max_iterations=50
        )

io.write_mesh_vtk(registered_mesh, out_file)
