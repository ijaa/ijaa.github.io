#include <skinning_pars_vertex>
#include <normal_pars_vertex>
#include ../includes/avatar-progress/vertex.glsl;

varying vec3 vViewPosition;

void main() {
    #include <skinbase_vertex>
    #include <beginnormal_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <normal_vertex>

    #include <begin_vertex>
    #include <skinning_vertex>

    #include <project_vertex>

    vViewPosition = -mvPosition.xyz;

    vModelProgress = getModelProgress(transformed);
}
