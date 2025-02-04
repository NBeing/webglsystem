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

in vec2 v_position;
// we need to declare an output for the fragment shader
out vec4 fragColor;
  
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
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

  vec4 color = vec4(0.);

  // vec2 st = v_position.xy / u_resolution.xy;
  // float rnd = random(st);
  // color = vec4(vec3(rnd), 1.0);

  fragColor = vec4(another.rgb, 1.);
}

