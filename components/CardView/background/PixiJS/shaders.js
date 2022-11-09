const baseVertexShaderSource = `precision mediump float;
attribute vec2 aVertexPosition;
attribute vec2 aUvs;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;

varying vec2 vUvs;

void main(){
    
    vUvs=aUvs;
    gl_Position=vec4((projectionMatrix*translationMatrix*vec3(aVertexPosition,1.)).xy,0.,1.);
    
}`

const gridFragmentShaderSource=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
precision mediump int;

varying vec2 vUvs;
uniform float time;
uniform float resolution;
uniform float invert;
uniform float zoom;
uniform float perspective;
uniform float wavysky;
uniform float wavyhorizon;
uniform float grounddensity;
uniform vec2 thicknessSky;
uniform vec2 thicknessGround;

float grid(vec2 pitch,float t1,float t2){
    vec2 coord=vUvs*resolution*2.*(1.-zoom);
    return float((mod(coord.x,pitch[0])<t1||
    mod(coord.y,pitch[1])<t2));
}

void main()
{
    vec2 uvN=vUvs;
    uvN.y=1.-uvN.y;vec2 uv=uvN*2.-1.;
    vec2 pos=uv*mix(.05,10.,perspective);
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
        
        gl_FragColor=colorOut;
    }
`

const colorFragmentShaderSource = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
precision mediump int;

varying vec2 vUvs;

uniform sampler2D texTexture;
uniform sampler2D texShape;
uniform sampler2D texPattern;

uniform vec4 background;
uniform vec4 layerOne;
uniform vec4 layerTwo;
uniform vec4 layerZero;
uniform vec2 off;
uniform float resTexture;
uniform bool toggleLayerZero;
uniform bool toggleLayerOne;
uniform bool toggleLayerTwo;
uniform int mode;

vec2 symmetry(vec2 v){
    if(v.x<0.){
        v.x=abs(v.x);
    }
    if(v.y<0.){
        v.y=abs(v.y);
    }
    if(v.x>1.){
        v.x=1.-fract(v.x);
    }
    if(v.y>1.){
        v.y=1.-fract(v.y);
    }
    return v;
}

void main()
{
    //Read color from all
    vec2 uvN=vUvs;
    vec4 shape=texture2D(texShape,uvN*1.);
    vec4 pattern=texture2D(texPattern,uvN);
    vec4 prev=texture2D(texTexture,uvN);
    vec4 prev2;
    if(mode==2){
        prev2=texture2D(texTexture,symmetry(uvN+off));
    }
    if(mode==1){
        prev2=texture2D(texTexture,fract(uvN+off));
    }
    if(mode==0){
        vec2 v=uvN+off;
        float inside=float(v.x>0.)*float(v.y>0.)*float(v.x<=1.)*float(v.y<=1.);
        prev2=texture2D(texTexture,v)*inside;
    }
    
    vec4 outColor=background;
    
    outColor=mix(outColor,layerZero,shape*1.5*float(toggleLayerZero));
    outColor=mix(outColor,layerOne,(prev.r)*float(toggleLayerOne));
    outColor=mix(outColor,layerTwo,(prev2.r)*float(toggleLayerTwo));
    
    gl_FragColor=outColor;
}

`