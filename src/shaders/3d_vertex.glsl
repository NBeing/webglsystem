#version 300 es
  
precision highp float;
layout(location = 0) in vec4 a_position;
layout(location = 1) in vec2 a_texCoord; 
layout(location = 2) in vec4 a_color; 
uniform mat4 u_matrix;
out vec2 v_texCoord;
out vec2 v_position;
out vec4 v_color;

// out vec2 gl_FragCoord;

// all shaders have a main function
void main() {
    gl_Position = u_matrix * a_position;
    // vec2 scaled = a_position * u_scale;
    // vec2 rotated = vec2(
    //     scaled.x * u_rotation.x - scaled.y * u_rotation.y,
    //     scaled.x * u_rotation.y + scaled.y * u_rotation.x
    //  );

    // vec2 translated = rotated + u_translation;
    // vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
    // vec2 zeroToOne = position / u_resolution;
    
    // // // convert from 0->1 to 0->2
    // vec2 zeroToTwo = zeroToOne * 2.0;
 
    // // // convert from 0->2 to -1->+1 (clip space)
    // vec2 clipSpace = zeroToTwo - 1.0;

    // v_position = vec2(int(zeroToOne));
    v_texCoord = a_texCoord;
    v_color = a_color;
    // color = 0.5;
    // gl_Position = vec4(clipSpace, 0.0,1.0);
    // // gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    // // gl_Position = vec4(a_position, 0.0, 1.0);
}