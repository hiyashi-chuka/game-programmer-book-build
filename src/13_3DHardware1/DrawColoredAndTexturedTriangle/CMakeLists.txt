cmake_minimum_required (VERSION 3.8)

set( PROJECT_NAME DrawColoredAndTexturedTriangle )
set( SECTION_NAME 3DHardware1 )

include( ../../cmake/SampleBase.cmake )

set_property(GLOBAL PROPERTY USE_FOLDERS ON)
set_target_properties(${PROJECT_NAME} PROPERTIES FOLDER 13_3DHardware )

# File Copy
set( COPY_FILES background.dds )
include( ../../cmake/copyresource.cmake )
