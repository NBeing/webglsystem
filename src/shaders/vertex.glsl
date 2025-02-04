#version 300 es
  
precision highp float;
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texCoord; 
uniform vec2 u_resolution;
uniform vec2 u_translation;
// let u_rotation =   [
//   Math.cos(angleInRadians),
//   Math.sin(angleInRadians),
// ]
uniform mat3 u_matrix;
uniform vec2 u_rotation;
uniform vec2 u_scale;
out vec2 v_texCoord;
out vec2 v_position;
out float color;
// out vec2 gl_FragCoord;

// all shaders have a main function
void main() {
    vec2 scaled = a_position * u_scale;
    //This formula is from the book
    // vec2 rotated = vec2(
    //     scaled.x * u_rotation.y + scaled.y * u_rotation.x,
    //     scaled.y * u_rotation.y - scaled.x * u_rotation.x
    //  );

    // This one is from "Math"/Wikipedia/Article lol
    // https://matthew-brett.github.io/teaching/rotation_2d.html
    vec2 rotated = vec2(
        scaled.x * u_rotation.x - scaled.y * u_rotation.y,
        scaled.x * u_rotation.y + scaled.y * u_rotation.x
     );

    vec2 translated = rotated + u_translation;
    // convert the position from pixels to 0.0 to 1.0
    // vec2 zeroToOne = translated / u_resolution;

    vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
    vec2 zeroToOne = position / u_resolution;
    
    // // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
 
    // // convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;

    v_position = vec2(int(zeroToOne));
    v_texCoord = a_texCoord;
    color = 0.5;
    gl_Position = vec4(clipSpace, 0.0,1.0);
    // gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    // gl_Position = vec4(a_position, 0.0, 1.0);

}