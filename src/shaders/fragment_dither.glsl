#version 300 es
  

// http://alex-charlton.com/posts/Dithering_on_the_GPU/
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

in vec2 v_position;
// we need to declare an output for the fragment shader
out vec4 fragColor;
  
vec2 fade(vec2 t) {return vec2(t*t*t*(t*(t*6.0-15.0)+10.0));}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
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


float indexValue() {
    float x  = mod(gl_FragCoord.x, 4.0);
    float y  = mod(gl_FragCoord.y, 4.0);
    int _x = int(x);
    int _y = int(y);
    
    int t = indexMatrix4x4[_x + _y * 4];
    return (float(t)) / 16.0;
}
float _indexValueRando() {
    float x  = mod(gl_FragCoord.x, 4.0);
    float y  = mod(gl_FragCoord.y, 4.0);
    int _x = int(x);
    int _y = int(y);
    int t = indexMatrix4x4[_x + _y * 4];
    return (float(random(gl_FragCoord.xy + u_time)));
}
float dither(float color){
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
  //  vec2 secondPixel = vec2(1) / vec2(textureSize(tex2, 1));
   vec4 twotex = texture(texture2, v_texCoord);

  // // average the left, middle, and right pixels.
  // fragColor = (
  //     texture(tex, v_texCoord) +
  //     texture(tex, v_texCoord + vec2( onePixel.x, 0.0)) +
  //     texture(tex, v_texCoord + vec2(-onePixel.x, 0.0))
  //   ) / 3.0; 

  // Basic Texture
  // fragColor = vec4(texture(texum, v_texCoord).rgb, 1.);


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

  // vec3 randoColor = vec3(0.4,0.2,0.2);
  vec3 another = colorSum.rgb  / u_kernelWeight;

  float i_float = float(indexMatrix4x4[15]);
  float c = (i_float / 255.0) + 0.25;
  // vec4 color = vec4(c, 0.,0.,1.);

  // vec2 st = v_position.xy / u_resolution.xy;
  // float rnd = random(st);
  // color = vec4(vec3(rnd), 1.0);
  vec4 current_pixel = texture(texum, v_texCoord + onePixel * vec2( 0,  0));

  float r = (dither(current_pixel.r) + colorSum.r* 0.25) ;
  float g = (dither(current_pixel.g) + colorSum.g* 0.25) ;
  float b = (dither(current_pixel.b) + colorSum.b* 0.25) ;
  // fragColor = vec4(vec3(dither(color)), 1);
  // float tf = indexValue(); 

  fragColor = vec4(r,g,b,1.);
  // fragColor = vec4(another.rgb, 1.);

}




// #version 300 es
  
// // fragment shaders don't have a default precision so we need
// // to pick one. highp is a good default. It means "high precision"
// precision highp float;
// uniform sampler2D texum;
// uniform sampler2D texture2;
// in vec2 v_texCoord;
// uniform float u_kernel[9];
// uniform float u_kernelWeight;
// uniform vec2 u_resolution;

// in vec2 v_position;
// // we need to declare an output for the fragment shader
// out vec4 fragColor;
  
// float random (vec2 st) {
//     return fract(sin(dot(st.xy,
//                          vec2(12.9898,78.233)))*
//         43758.5453123);
// }

// const int indexMatrix4x4[16] = int[](0,  8,  2,  10,
//                                      12, 4,  14, 6,
//                                      3,  11, 1,  9,
//                                      15, 7,  13, 5);

// float indexValue() {
//     float x  = mod(gl_FragCoord.x, 4.0);
//     float y  = mod(gl_FragCoord.y, 4.0);
//     int _x = int(x);
//     int _y = int(y);
    
//     int t = indexMatrix4x4[_x + _y * 4];
//     return float(t) / 16.0;
// }
// float dither(float color){
//   float closestColor = (color < 0.5) ? 0. : 1.;
//   float secondClosestColor = 1. - closestColor;
//   float d = indexValue();
//   float distance = abs(closestColor - color);
//   float result = (distance < d) ? closestColor : secondClosestColor;
//   return result;
// }
// void main() {
//    vec2 onePixel = vec2(1) / vec2(textureSize(texum, 1));
//   //  vec2 secondPixel = vec2(1) / vec2(textureSize(tex2, 1));
//    vec4 twotex = texture(texture2, v_texCoord);

//   // // average the left, middle, and right pixels.
//   // fragColor = (
//   //     texture(tex, v_texCoord) +
//   //     texture(tex, v_texCoord + vec2( onePixel.x, 0.0)) +
//   //     texture(tex, v_texCoord + vec2(-onePixel.x, 0.0))
//   //   ) / 3.0; 

//   // Basic Texture
//   // fragColor = vec4(texture(texum, v_texCoord).rgb, 1.);


//     vec4 colorSum =
//       texture(texum, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
//       texture(texum, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
//       texture(texum, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
//       texture(texum, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
//       texture(texum, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
//       texture(texum, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
//       texture(texum, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
//       texture(texum, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
//       texture(texum, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

//   // vec3 randoColor = vec3(0.4,0.2,0.2);
//   vec3 another = colorSum.rgb  / u_kernelWeight;

//   float i_float = float(indexMatrix4x4[15]);
//   float c = (i_float / 255.0) + 0.25;
//   // vec4 color = vec4(c, 0.,0.,1.);

//   // vec2 st = v_position.xy / u_resolution.xy;
//   // float rnd = random(st);
//   // color = vec4(vec3(rnd), 1.0);
//   vec4 current_pixel = texture(texum, v_texCoord + onePixel * vec2( 0,  0));


//   float r = dither(current_pixel.r);
//   float g = dither(current_pixel.g);
//   float b = dither(current_pixel.b);
//   // fragColor = vec4(vec3(dither(color)), 1);
//   // float tf = indexValue(); 

//   fragColor = vec4(r,g,b,1.);
//   // fragColor = vec4(another.rgb, 1.);

// }

