import  { initProgram ,data } from './common'


export const getUniforms = (time: number, canvas: HTMLCanvasElement) => ({
    grid: {
        time: time * data['time'],
        resolution: [canvas.width, canvas.height],
        invert: data['pattern-invert'],
        zoom: data['pattern-zoom'],
        perspective: data['grid-perspective'],
        wavysky: data['grid-wavysky'],
        wavyhorizon: data['grid-wavyhorizon'],
        grounddensity:data['grid-grounddensity'],
        thicknessSky: [data['grid-thicknessSky'].x,data['grid-thicknessSky'].y] ,
        thicknessGround: [data['grid-thicknessGround'].x, data['grid-thicknessGround'].y],
    },
    caustics: {
        time: time * data['time'],
        zoom: data['pattern-zoom'],
        brightness: data['caustic-brightness'],
        contrast: data['caustic-contrast'],
        blur: data['caustic-blur'],
        lumaSelection: data['caustic-lumaSelection'],
        invert: data['pattern-invert'],
        resolution: [canvas.width, canvas.height]
    }
    
});

const gridFragmentShaderSource = `precision mediump float;

varying vec2 vUv;

uniform float time;
uniform float invert;
uniform float zoom;
uniform float perspective;
uniform float wavysky;
uniform float wavyhorizon;
uniform float grounddensity;
uniform vec2 thicknessSky;
uniform vec2 thicknessGround;
uniform vec2 resolution;

vec2 uvN(){return (gl_FragCoord.xy / resolution);}
vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}

float grid(vec2 pitch,float t1,float t2){
    vec2 coord=gl_FragCoord.xy*0.7*(1.-zoom);
    return float((mod(coord.x,pitch[0])<t1||
    mod(coord.y,pitch[1])<t2));
}

void main()
{
    vec2 uvN=uvN(); vec2 uv=uv();

    vec2 pos=uv*mix(.5,10.,perspective);
    vec2 pos2=pos;
    
    vec4 color=vec4(1.);vec4 colorOut=vec4(0.);
    vec2 pitch;
    
    float horizon=cos(pos2.x*mix(.5,40.,wavyhorizon)+time)*mix(.1,.01,pow(wavyhorizon,.65))*(1.-pos2.y);
    pos.y=abs(pos.y);
    pos.y-=.1;
    
    if((pos2.y)<horizon){
        pitch=vec2(mix(1.,100.,grounddensity)-pos2.y*10.+cos(pos.y*10.)*.2,20.+horizon*3.);
        float g=grid(pitch,thicknessGround[0],thicknessGround[1]);
        colorOut+=mix(g,1.-g,invert);
        
    }else{
        pitch=vec2(
            20.+pos2.y*30.,
            40.*uvN.y+cos((uvN.x)*mix(30.,100.,wavysky)+time)*3.*uv.y);
            float g=grid(pitch,thicknessSky[0],thicknessSky[1]);
            colorOut+=mix(1.-g,g,invert);
        }
        
        gl_FragColor=vec4(colorOut.rgb,1.);
    }`

const causticsFragmentShaderSource = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
precision mediump int;

varying vec2 vUv;
uniform float time;
uniform float zoom;
uniform float brightness;
uniform float contrast;
uniform float blur;
uniform float lumaSelection;
uniform float invert;
uniform vec2 resolution;

vec2 uvN(){return (gl_FragCoord.xy / resolution);}
vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}


float distance_p(vec3 pos,float p){
    float d=pow(abs(pos.x),p)+pow(abs(pos.y),p)+pow(abs(pos.z),p);
    d=pow(d,1./p);
    return d;
}

vec4 permute(vec4 t){
    return t*(t*34.+133.);
}

// Gradient set is a normalized expanded rhombic dodecahedron
vec3 grad(float hash){
    vec3 cube=mod(floor(hash/vec3(1.,2.,4.)),2.)*2.-1.;

    vec3 cuboct=cube;
    int index=int(hash/16.);
    cuboct[0]=cube[0]*float(index!=0);
    cuboct[1]=cube[1]*float(index!=1);
    cuboct[2]=cube[2]*float(index!=2);
    
    float type=mod(floor(hash/18.),2.);
    vec3 rhomb=(1.-type)*cube+type*(cuboct+cross(cube,cuboct));
    
    vec3 grad=cuboct*1.22474487139+rhomb;
    grad*=(1.-.042942436724648037*type)*3.5946317686139184;
    
    return grad;
}

vec4 bccNoiseDerivativesPart(vec3 X){
    vec3 b=floor(X);
    vec4 i4=vec4(X-b,2.5);
    vec3 v1=b+floor(dot(i4,vec4(.25)));
    vec3 v2=b+vec3(1,0,0)+vec3(-1,1,1)*floor(dot(i4,vec4(-.25,.25,.25,.35)));
    vec3 v3=b+vec3(0,1,0)+vec3(1,-1,1)*floor(dot(i4,vec4(.25,-.25,.25,.35)));
    vec3 v4=b+vec3(0,0,1)+vec3(1,1,-1)*floor(dot(i4,vec4(.25,.25,-.25,.35)));
    vec4 hashes=permute(mod(vec4(v1.x,v2.x,v3.x,v4.x),289.));
    hashes=permute(mod(hashes+vec4(v1.y,v2.y,v3.y,v4.y),289.));
    hashes=mod(permute(mod(hashes+vec4(v1.z,v2.z,v3.z,v4.z),289.)),48.);
    
    vec3 d1=X-v1;vec3 d2=X-v2;vec3 d3=X-v3;vec3 d4=X-v4;
    vec4 a=max(.7-vec4(dot(d1,d1),dot(d2,d2),dot(d3,d3),dot(d4,d4)),0.);
    vec4 aa=a*a;vec4 aaaa=aa*aa;
    vec3 g1=grad(hashes.x);vec3 g2=grad(hashes.y);
    vec3 g3=grad(hashes.z);vec3 g4=grad(hashes.w);
    vec4 extrapolations=vec4(dot(d1,g1),dot(d2,g2),dot(d3,g3),dot(d4,g4));
    
    vec4 i=(aa*a*extrapolations);
    // Derivatives of the noise
    vec3 derivative=-8.*
    vec3(d1.x*i.x+d2.x*i.y+d3.x*i.z+d4.x*i.w,
        d1.y*i.x+d2.y*i.y+d3.y*i.z+d4.y*i.w,
        d1.z*i.x+d2.z*i.y+d3.z*i.z+d4.z*i.w
    );
    i=aaaa;
    derivative+=vec3(g1.x*i.x+g2.x*i.y+g3.x*i.z+g4.x*i.w,
        g1.y*i.x+g2.y*i.y+g3.y*i.z+g4.y*i.w,
    g1.z*i.x+g2.z*i.y+g3.z*i.z+g4.z*i.w);
    
    // Return it all as a vec4
    return vec4(derivative,dot(aaaa,extrapolations));
}

vec4 bccNoiseDerivatives_XYZ(vec3 X){
    X=dot(X,vec3(2./3.))-X;
    
    vec4 result=bccNoiseDerivativesPart(X)+bccNoiseDerivativesPart(X+144.5);
    
    return vec4(dot(result.xyz,vec3(2./3.))-result.xyz,result.w);
}

vec4 bccNoiseDerivatives_ImproveXYPlanes(vec3 X){
    mat3 orthonormalMap=mat3(
        .788675134594813,-.211324865405187,-.7735069189626,
        -.1324865405187,.788675134594813,-.577350269189626,
    .577350269189626,.577350269189626,.577350269189626);
    
    X=orthonormalMap*X;
    vec4 result=bccNoiseDerivativesPart(X)+bccNoiseDerivativesPart(X+144.5);
    
    return vec4(result.xyz*orthonormalMap,result.w);
}

void main()
{
    vec2 uvN = uvN();
    vec2 uv = uvN;

    uv*=mix(.1,5.,1.-zoom);
    
    vec3 X=vec3(uv,mod(time,578.)*.3);
    
    vec4 noiseResult=bccNoiseDerivatives_ImproveXYPlanes(X);
    
    float p=asin(noiseResult.w);
    float derivMag=distance_p(noiseResult.xyz,2.);
    float sinScale=derivMag;
    float value=sin(p-sinScale*derivMag/20.);
    
    vec3 col=mix(vec3(0.,.0,.0),vec3(1.,1.,1.),brightness+contrast*value);
    
     col=smoothstep(lumaSelection,lumaSelection+blur,col);

    vec3 outColor = mix(col,1.-col,invert);
    gl_FragColor=vec4(outColor,1.);
}
`

export const initPrograms = (gl: WebGLRenderingContext) => {

    const grid = initProgram(gl, gridFragmentShaderSource);
    const caustics = initProgram(gl, causticsFragmentShaderSource);

    return {
        grid,
        caustics
    }
}