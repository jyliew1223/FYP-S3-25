Shader "Custom/ChromaKeyWhite"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Cutoff ("Transparency Cutoff", Range(0,1)) = 0.1
        _Tolerance ("Color Tolerance", Range(0,1)) = 0.1
    }
    SubShader
    {
        Tags { "Queue"="Transparent" "RenderType"="Transparent" }
        Blend SrcAlpha OneMinusSrcAlpha
        ZWrite Off
        Cull Off

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            sampler2D _MainTex;
            float _Cutoff;
            float _Tolerance;

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
            };

            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                fixed4 col = tex2D(_MainTex, i.uv);

                // Target color: pure white
                fixed3 targetColor = fixed3(1, 1, 1);
                float diff = distance(col.rgb, targetColor);

                // If close to white, make it transparent
                if (diff < _Tolerance)
                {
                    col.a = 0;
                }

                // Apply cutoff
                if (col.a < _Cutoff)
                {
                    discard;
                }

                return col;
            }
            ENDCG
        }
    }
}
