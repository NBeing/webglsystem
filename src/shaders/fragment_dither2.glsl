#version 300 es
  
// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;
uniform sampler2D texum;
uniform sampler2D texture2;
in vec2 v_texCoord;
uniform float u_kernel[9];
uniform float u_kernelWeight;
uniform vec2 u_resolution;
uniform float u_time;

uniform vec3 palette[8];
uniform int paletteSize;

in vec2 v_position;
// we need to declare an output for the fragment shader
out vec4 fragColor;
  
const float EPSILON = 1e-10;

// https://www.shadertoy.com/view/4dKcWK
vec3 HUEtoRGB(float hue)
{
    // Hue [0..1] to RGB [0..1]
    // See http://www.chilliant.com/rgb2hsv.html
    vec3 rgb = abs(hue * 6. - vec3(3, 2, 4)) * vec3(1, -1, -1) + vec3(-1, 2, 2);
    return clamp(rgb, 0., 1.);
}

vec3 RGBtoHCV(vec3 rgb)
{
    // RGB [0..1] to Hue-Chroma-Value [0..1]
    // Based on work by Sam Hocevar and Emil Persson
    vec4 p = (rgb.g < rgb.b) ? vec4(rgb.bg, -1., 2. / 3.) : vec4(rgb.gb, 0., -1. / 3.);
    vec4 q = (rgb.r < p.x) ? vec4(p.xyw, rgb.r) : vec4(rgb.r, p.yzx);
    float c = q.x - min(q.w, q.y);
    float h = abs((q.w - q.y) / (6. * c + EPSILON) + q.z);
    return vec3(h, c, q.x);
}

vec3 HSVtoRGB(vec3 hsv)
{
    // Hue-Saturation-Value [0..1] to RGB [0..1]
    vec3 rgb = HUEtoRGB(hsv.x);
    return ((rgb - 1.) * hsv.y + 1.) * hsv.z;
}

vec3 HSLtoRGB(vec3 hsl)
{
    // Hue-Saturation-Lightness [0..1] to RGB [0..1]
    vec3 rgb = HUEtoRGB(hsl.x);
    float c = (1. - abs(2. * hsl.z - 1.)) * hsl.y;
    return (rgb - 0.5) * c + hsl.z;
}

vec3 RGBtoHSV(vec3 rgb)
{
    // RGB [0..1] to Hue-Saturation-Value [0..1]
    vec3 hcv = RGBtoHCV(rgb);
    float s = hcv.y / (hcv.z + EPSILON);
    return vec3(hcv.x, s, hcv.z);
}

vec3 RGBtoHSL(vec3 rgb)
{
    // RGB [0..1] to Hue-Saturation-Lightness [0..1]
    vec3 hcv = RGBtoHCV(rgb);
    float z = hcv.z - hcv.y * 0.5;
    float s = hcv.y / (1. - abs(z * 2. - 1.) + EPSILON);
    return vec3(hcv.x, s, z);
}
//https://www.chilliant.com/rgb2hsv.html
// https://stackoverflow.com/questions/15095909/from-rgb-to-hsv-in-opengl-glsl
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

float hueDistance(float h1, float h2) {
    float diff = abs((h1 - h2));
    return min(abs((1.0 - diff)), diff);
}



vec3[2] closestColors(float hue) {
    vec3 ret[2];
    vec3 closest = vec3(-2, 0, 0);
    vec3 secondClosest = vec3(-2, 0, 0);
    vec3 temp;
    for (int i = 0; i < paletteSize; ++i) {
        temp = palette[i];
        float tempDistance = hueDistance(temp.x, hue);
        if (tempDistance < hueDistance(closest.x, hue)) {
            secondClosest = closest;
            closest = temp;
        } else {
            if (tempDistance < hueDistance(secondClosest.x, hue)) {
                secondClosest = temp;
            }
        }
    }
    ret[0] = closest;
    ret[1] = secondClosest;
    return ret;
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

const int indexMatrix4x4[16] = int[](0,  8,  2,  10,
                                     12, 4,  14, 6,
                                     3,  11, 1,  9,
                                     15, 7,  13, 5);

const int indexMatrix8x8[64] = int[](0,  32, 8,  40, 2,  34, 10, 42,
                                     48, 16, 56, 24, 50, 18, 58, 26,
                                     12, 44, 4,  36, 14, 46, 6,  38,
                                     60, 28, 52, 20, 62, 30, 54, 22,
                                     3,  35, 11, 43, 1,  33, 9,  41,
                                     51, 19, 59, 27, 49, 17, 57, 25,
                                     15, 47, 7,  39, 13, 45, 5,  37,
                                     63, 31, 55, 23, 61, 29, 53, 21);


float indexValue() {
    float x  = mod(gl_FragCoord.x, 8.0);
    float y  = mod(gl_FragCoord.y, 8.0);
    int _x = int(x);
    int _y = int(y);
    
    int t = indexMatrix4x4[_x + _y * 8];
    return (float(t)) / 64.0;
}
float _indexValueRando() {
    float x  = mod(gl_FragCoord.x, 4.0);
    float y  = mod(gl_FragCoord.y, 4.0);
    int _x = int(x);
    int _y = int(y);
    int t = indexMatrix4x4[_x + _y * 4];
    return (float(random(gl_FragCoord.xy + u_time)));
}
vec3 dither(vec3 color) {
    vec3 hsl = RGBtoHSL(color);
    vec3 colors[2];
    colors[0] = closestColors(hsl.x)[0];
    colors[1] = closestColors(hsl.x)[1];

    vec3 closestColor = colors[0];
    vec3 secondClosestColor = colors[1];
    float d = indexValue();
    float hueDiff = hueDistance(hsl.x, closestColor.x) /
                    hueDistance(secondClosestColor.x, closestColor.x);
    return HSLtoRGB(hueDiff < d ? closestColor : secondClosestColor);
}
const float lightnessSteps = 4.0;

float lightnessStep(float l) {
    /* Quantize the lightness to one of `lightnessSteps` values */
    return floor((0.5 + l * lightnessSteps)) / lightnessSteps;
}

vec3 dither3(vec3 color) {
    vec3 hsl = RGBtoHSL(color);

    vec3 cs[2] = closestColors(hsl.x);
    vec3 c1 = cs[0];
    vec3 c2 = cs[1];
    float d = indexValue();
    float hueDiff = hueDistance(hsl.x, c1.x) / hueDistance(c2.x, c1.x);

    float l1 = lightnessStep(max((hsl.z - 0.125), 0.0));
    float l2 = lightnessStep(min((hsl.z + 0.124), 1.0));
    float lightnessDiff = (hsl.z - l1) / (l2 - l1);

    vec3 resultColor = (hueDiff < d) ? c1 : c2;
    resultColor.z = (lightnessDiff < d) ? l1 : l2;
    return HSLtoRGB(resultColor);
}

float ditherold(float color){
  float closestColor = (color < 0.5) ? 0. : 1.;
  float secondClosestColor = 1. - closestColor;
  float d = indexValue();
  float distance = abs(closestColor - color);
  // closest color -- is it max value or min i.e. white or black
  // color is going to be some float 0.25
  // so 0.25
  float result = (distance < d) ? closestColor : secondClosestColor;
  return result;
}
void main() {
  vec2 onePixel = vec2(1) / vec2(textureSize(texum, 1));
  vec4 twotex = texture(texture2, v_texCoord);
  vec4 colorSum =
    texture(texum, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
    texture(texum, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
    texture(texum, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
    texture(texum, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
    texture(texum, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
    texture(texum, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
    texture(texum, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
    texture(texum, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
    texture(texum, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

  vec4 current_pixel = texture(texum, v_texCoord + onePixel * vec2( 0,  0));

  float r = (ditherold(current_pixel.r) + colorSum.r* 0.25) ;
  float g = (ditherold(current_pixel.g) + colorSum.g* 0.25) ;
  float b = (ditherold(current_pixel.b) + colorSum.b* 0.25) ;
  vec4 secondDither = vec4(r,g,b,1.0);
    
  fragColor = vec4(
    vec4(dither(current_pixel.rgb).rgb, 0.3) / 2. + 
    vec4(secondDither.rgb, 0.3) / 8. + 
    vec4(colorSum.rgb, 0.3) / 8. 
  );
  // fragColor = vec4(
  //   vec4(dither3(current_pixel.rgb).rgb, 0.3) 
  // );

}



