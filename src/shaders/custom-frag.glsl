#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform vec4 u_Time;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

in vec3 ray_Dir;
in vec4 ws_Pos;
in float perlin;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.


float cosine_remap(float x) {
    return (1.0 - cos(x * 3.1415)) / 2.0;
}

float contrast_remap(float x) {
    return x * (x + 0.5) * (x + 0.5) * (x + 0.5) ;
}

void main()
{
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;
        //diffuseColor = vec4(ws_Pos);

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor), normalize(fs_LightVec));
        float perlin_factor = perlin * cosine_remap(abs(u_Time.x - 150.0)  / 300.0);
        perlin_factor = (perlin_factor + 0.1) * (perlin_factor + 0.5) * 1.5;
        perlin_factor = clamp(perlin_factor, 0.0, 1.0);
        perlin_factor = perlin;
        diffuseColor = mix(diffuseColor, vec4(1,0,0,1), perlin_factor);
        if(perlin_factor > 0.7) {
            //diffuseColor = vec4(0,1,0,1);
            diffuseColor = mix(diffuseColor, vec4(0.7,1.0,0.8,1), cosine_remap((perlin_factor - 0.8) * 5.0));
        } else if(perlin_factor < 0.2) {
            diffuseColor = mix(vec4(0.4,0,0.4,1),diffuseColor, (perlin_factor) * 5.0);

        }
        diffuseColor = vec4(1.0);
        diffuseTerm = 1.0;
        // Avoid negative lighting values
        // diffuseTerm = clamp(diffuseTerm, 0, 1);

        // ray marching step


        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.
        //lightIntensity = 1.0f;
        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
        out_Col = vec4(fs_Nor.xyz,1.0);
}
