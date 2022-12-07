import { initProgram, Params } from "./common";

export const getUniforms = (data: Params, time: number, canvas: HTMLCanvasElement) => {
  return {
    light: {
      time: time * data["time"],
      peak: data["light-peak"],
      intensity: data["light-intensity"],
      resolution: [canvas.width, canvas.height],
    },
    shadow: {
      p: data["shadow-p"],
      r: data["shadow-r"],
      border: data["shadow-border"],
      resolution: [canvas.width, canvas.height],
    },
  };
};

const lightFragmentShaderSource = `precision mediump float;
varying vec2 vUv;
uniform float time;
uniform float peak;
uniform float intensity;
uniform vec2 resolution;

vec2 uvN(){return (gl_FragCoord.xy / resolution);}
vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}

#define PI 3.1415926

float superformula(vec2 pos,
    float m,
    float n1,
    float n2,
    float n3,
float scale){
    float r=length(pos)*(1./scale);
    float phi=atan(pos.y,pos.x)+PI;
    
    float f=pow(pow(abs(cos(m*phi/4.)),n2)+pow(abs(sin(m*phi/4.)),n3),-1./n1);
    
    return max(0.,.99*abs(r-f));
}

void main() {
    //Offset uv so that center is 0,0 and edges are -1,1
    vec2 uv=uv();
    uv.x+=cos(dot(uv,uv)+time*.5);
    vec3 outColor=vec3(0.);
    
    float s=max(
        superformula(uv,peak,1.,1.,2.8,2.),
        superformula(uv,peak*3.,1.,2.,1.8,2.));
        
        s/=(2.-intensity)/cos(dot(s,s));
        
        outColor.r+=s;
        outColor.g+=s;
        outColor.b+=s;
        
        gl_FragColor=vec4(outColor,1.);
}`;

const shadowFragmentShaderSource = `precision mediump float;
    varying vec2 vUv;
    uniform float time;
    uniform float p;
    uniform float r;
    uniform float border;
    uniform vec2 resolution;
    #define PI 3.1415926

    vec2 uvN(){return (gl_FragCoord.xy / resolution);}
    vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}



    float distance_p(vec2 pos,float p){
        float d=pow(abs(pos.x),p)+pow(abs(pos.y),p);
        d=pow(d,1./p);
        return d;
    }

    void main()
    {
        vec2 uv=uv();vec3 outColor;
        outColor+=smoothstep(0.,border,1.-distance_p(uv,p)-r);
        
        gl_FragColor=vec4(outColor,1.);
    }`;

export const initPrograms = (gl: WebGLRenderingContext) => {
  const light = initProgram(gl, lightFragmentShaderSource);

  const shadow = initProgram(gl, shadowFragmentShaderSource);

  return {
    light,
    shadow,
  };
};
