#include ../includes/avatar-progress/fragment.glsl;
#include ../includes/about-ambient.glsl;
#include <normal_pars_fragment>

uniform sampler2D uMatcap;

varying vec3 vViewPosition;

void main() {
    #include <normal_fragment_begin>

    vec3 viewDir = normalize(vViewPosition);

    vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
    vec3 y = cross(viewDir, x);
    vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;

    vec3 matcapColor = texture2D(uMatcap, uv).rgb;

    float progress = getProgress();

    matcapColor = applyAmbient(matcapColor);

    gl_FragColor = vec4(matcapColor, progress);
}
