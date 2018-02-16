#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform mat4 u_View;
uniform mat4 u_ViewInv;

uniform vec4 u_Time;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.

out vec3 ray_Dir;
out vec4 ws_Pos;
out float perlin;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.


float fract_comp(float x) {
    return x - floor(x);
}

float fade (float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); 
}

float cosine_remap(float x) {
    return (1.0 - cos(x * 3.1415)) / 2.0;
}

float lerp(float x0, float x1, float t) {
    return (1.0 - t) * x0 + (t * x1);
}

vec3 noise_gen3D(vec3 pos) {
    float x = fract(sin(dot(vec3(pos.x,pos.y,pos.z), vec3(12.9898, 78.233, 78.156))) * 43758.5453);
    float y = fract(sin(dot(vec3(pos.x,pos.y,pos.z), vec3(2.332, 14.5512, 170.112))) * 78458.1093);
    float z = fract(sin(dot(vec3(pos.x,pos.y,pos.z), vec3(400.12, 90.5467, 10.222))) * 90458.7764);
    return 2.0 * (vec3(x,y,z) - 0.5);
}

float dotGridGradient(vec3 grid, vec3 pos) {
    vec3 grad = normalize(noise_gen3D(grid));
    vec3 diff = (pos - grid);
    //return grad.x;
    return clamp(dot(grad,diff),-1.0,1.0);
}

float perlin3D(vec3 pos, float step) {
    pos = pos/step;
    vec3 ming = floor(pos / step) * step;
    ming = floor(pos);
    vec3 maxg = ming + vec3(step, step, step);
    maxg = ming + vec3(1.0);
    vec3 range = maxg - ming;
    vec3 diff = pos - ming;
    vec3 diff2 = maxg - pos;
    float d000 = dotGridGradient(ming, pos);
    float d001 = dotGridGradient(vec3(ming[0], ming[1], maxg[2]), pos);
    float d010 = dotGridGradient(vec3(ming[0], maxg[1], ming[2]), pos);
    float d011 = dotGridGradient(vec3(ming[0], maxg[1], maxg[2]), pos);
    float d111 = dotGridGradient(vec3(maxg[0], maxg[1], maxg[2]), pos);
    float d100 = dotGridGradient(vec3(maxg[0], ming[1], ming[2]), pos);
    float d101 = dotGridGradient(vec3(maxg[0], ming[1], maxg[2]), pos);
    float d110 = dotGridGradient(vec3(maxg[0], maxg[1], ming[2]), pos);

    float ix00 = mix(d000,d100, fade(diff[0]));
    float ix01 = mix(d001,d101, fade(diff[0]));
    float ix10 = mix(d010,d110, fade(diff[0]));
    float ix11 = mix(d011,d111, fade(diff[0]));

    float iy0 = mix(ix00, ix10, fade(diff[1]));
    float iy1 = mix(ix01, ix11, fade(diff[1]));

    float iz = mix(iy0, iy1, fade(diff[2]));

    return (iz + 1.0) / 2.0;
}


vec3 hash( vec3 p ) // replace this by something better. really. do
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
			  dot(p,vec3(269.5,183.3,246.1)),
			  dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec4 perlin3DGrad(vec3 pos, float step) {
    pos = pos;
    vec3 ming = floor(pos);
    vec3 maxg = ming + vec3(1.0);
    vec3 range = maxg - ming;
    vec3 diff = pos - ming;
    vec3 diff2 = maxg - pos;
   
    vec3 p = floor(pos);
    vec3 w = fract(pos);
    
    #if 1
    // quintic interpolant
    vec3 u = w*w*w*(w*(w*6.0-15.0)+10.0);
    vec3 du = 30.0*w*w*(w*(w-2.0)+1.0);
    #else
    // cubic interpolant
    vec3 u = w*w*(3.0-2.0*w);
    vec3 du = 6.0*w*(1.0-w);
    #endif  

    // gradients
    vec3 ga = hash( p+vec3(0.0,0.0,0.0) );
    vec3 gb = hash( p+vec3(1.0,0.0,0.0) );
    vec3 gc = hash( p+vec3(0.0,1.0,0.0) );
    vec3 gd = hash( p+vec3(1.0,1.0,0.0) );
    vec3 ge = hash( p+vec3(0.0,0.0,1.0) );
	vec3 gf = hash( p+vec3(1.0,0.0,1.0) );
    vec3 gg = hash( p+vec3(0.0,1.0,1.0) );
    vec3 gh = hash( p+vec3(1.0,1.0,1.0) );
    
    // projections
    float va = dot( ga, w-vec3(0.0,0.0,0.0) );
    float vb = dot( gb, w-vec3(1.0,0.0,0.0) );
    float vc = dot( gc, w-vec3(0.0,1.0,0.0) );
    float vd = dot( gd, w-vec3(1.0,1.0,0.0) );
    float ve = dot( ge, w-vec3(0.0,0.0,1.0) );
    float vf = dot( gf, w-vec3(1.0,0.0,1.0) );
    float vg = dot( gg, w-vec3(0.0,1.0,1.0) );
    float vh = dot( gh, w-vec3(1.0,1.0,1.0) );
	
    // interpolations
    return vec4( va + u.x*(vb-va) + u.y*(vc-va) + u.z*(ve-va) + u.x*u.y*(va-vb-vc+vd) + u.y*u.z*(va-vc-ve+vg) + u.z*u.x*(va-vb-ve+vf) + (-va+vb+vc-vd+ve-vf-vg+vh)*u.x*u.y*u.z,    // value
                 ga + u.x*(gb-ga) + u.y*(gc-ga) + u.z*(ge-ga) + u.x*u.y*(ga-gb-gc+gd) + u.y*u.z*(ga-gc-ge+gg) + u.z*u.x*(ga-gb-ge+gf) + (-ga+gb+gc-gd+ge-gf-gg+gh)*u.x*u.y*u.z +   // derivatives
                 du * (vec3(vb,vc,ve) - va + u.yzx*vec3(va-vb-vc+vd,va-vc-ve+vg,va-vb-ve+vf) + u.zxy*vec3(va-vb-ve+vf,va-vb-vc+vd,va-vc-ve+vg) + u.yzx*u.zxy*(-va+vb+vc-vd+ve-vf-vg+vh) ));
}

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.


    vec4 modelposition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below

    ray_Dir = normalize(vec3(modelposition - (u_ViewInv * vec4(0,0,0,1))));
    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies
    float t = (cos(2.0 * 3.1415 * u_Time.x / 300.0)  + 1.0 ) / 2.0;
    t = t * 0.4 + 0.5;
    // uncomment for weird behavior
    t *= 1.5;
    perlin = (perlin3D(vec3(modelposition), 0.6)) * t;
    float perlin_surf = 1.0 - 0.5 * (perlin3D(vec3(modelposition), 0.2)) * t;
    float perlin_surf2 = 0.1 * (perlin3D(vec3(modelposition), 0.1));
    if(perlin > 0.8){
        perlin *= perlin_surf;
    }
    
    perlin += perlin_surf2;
    perlin = fade(perlin);
    if(perlin < 0.4) {
        perlin *= perlin * 2.0;
    }
    
    vec4 perlin4 = perlin3DGrad(vec3(modelposition),1.0);
    //if(perlin < 0.3) { perlin = 0.0;}
    ws_Pos = modelposition + perlin4.x * vec4(vs_Nor) * 1.0;
    //ws_Pos = modelposition;
    vec3 grad = perlin4.yzw;
    grad = normalize(grad);
    vec3 bi = cross(grad, vec3(vs_Nor));
    bi = normalize(bi);
    vec3 norm = cross(bi,grad);
    norm = normalize(norm);
    fs_Nor = vec4((norm), 0.0);
    gl_Position = u_ViewProj * ws_Pos;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
    
}
