export const baseVertexShaderSource = `attribute vec4 position;

void main() {
  gl_Position = position;
}`

export const colorFragmentShaderSource = `precision mediump float;

uniform vec2 resolution;
uniform float time;

void main(){
    vec2 uv=gl_FragCoord.xy/resolution;
    gl_FragColor=uv.xxyy;
}`