import * as sb from "./supabase";

// Extraído de PostFormModal.jsx: CursoPage lo importaba estáticamente y eso
// arrastraba todo PostFormModal (incl. PerfilPage) a su chunk, rompiendo el
// code-splitting (INEFFECTIVE_DYNAMIC_IMPORT).

// ─── FUNCIÓN GLOBAL: DISPARAR ALERTAS ────────────────────────────────────────
// Se llama cuando una publicación pasa a estado activo:true
// Puede ser al crear (si no tiene wizard), al omitir wizard, o al finalizar wizard
export async function dispararAlertasIA(pub, session){
  try{
    const alertas=await sb.db(
      `alertas_publicacion?activa=eq.true&usuario_id=neq.${session.user.id}&select=*`,
      "GET",null,session.access_token
    ).catch(()=>[]);
    if(!alertas?.length)return;

    const pubPerfil={
      titulo:pub.titulo||"",
      descripcion:(pub.descripcion||"").slice(0,300),
      materia:pub.materia||"",
      tipo:pub.tipo||"oferta",
      modalidad:pub.modalidad||"",
      ubicacion:pub.ubicacion||"",
      precio:pub.precio?String(pub.precio):"Gratis",
      nivel:pub.nivel||"",
      certificado:pub.otorga_certificado?"Sí":"No",
      frecuencia:pub.frecuencia||"",
    };

    for(const alerta of alertas){
      try{
        const tipoAlerta=alerta.tipo_alerta||"ambos";
        if(tipoAlerta!=="ambos"&&pubPerfil.tipo!==tipoAlerta)continue;

        let criterios={};
        try{criterios=JSON.parse(alerta.criterios_json||"{}");}catch{}

        const alertaCtx=[
          `Descripción libre: "${alerta.descripcion}"`,
          criterios.materia?`Materia de interés: ${criterios.materia}`:"",
          criterios.modalidad&&criterios.modalidad!=="cualquiera"?`Modalidad preferida: ${criterios.modalidad}`:"",
          criterios.palabras_clave?.length?`Palabras clave: ${criterios.palabras_clave.join(", ")}`:"",
          alerta.usuario_ciudad?`Ciudad del usuario: ${alerta.usuario_ciudad}`:"",
        ].filter(Boolean).join("\n");

        const pubCtx=[
          `Título: "${pubPerfil.titulo}"`,
          `Descripción: "${pubPerfil.descripcion}"`,
          `Materia: ${pubPerfil.materia||"No especificada"}`,
          `Modalidad: ${pubPerfil.modalidad||"No especificada"}`,
          pubPerfil.ubicacion?`Ubicación: ${pubPerfil.ubicacion}`:"Sin ubicación",
          `Precio: ${pubPerfil.precio}`,
          pubPerfil.nivel?`Nivel: ${pubPerfil.nivel}`:"",
          `Otorga certificado: ${pubPerfil.certificado}`,
          pubPerfil.frecuencia?`Frecuencia: ${pubPerfil.frecuencia}`:"",
        ].filter(Boolean).join("\n");

        const raw=await sb.callIA(
          `Sos un sistema de matching para alertas educativas en Argentina.\nEvaluá si una publicación nueva es relevante para la búsqueda del usuario.\n\nREGLAS (evaluá TODAS):\n1. TEMA: ¿El título/descripción/materia es relevante? Considerá sinónimos y conceptos relacionados. Es el criterio más importante.\n2. MODALIDAD: Si pidió "presencial" y es "virtual" → NO coincide. Si no especificó → cualquiera sirve.\n3. UBICACIÓN: Si mencionó ciudad y la clase es presencial en otra ciudad → NO coincide. Si es virtual → ubicación no importa.\n4. CERTIFICADO: Si explícitamente quiere certificado y la pub no lo otorga → NO coincide.\n5. NIVEL: Si mencionó nivel específico y no coincide → penaliza pero no descarta solo por esto.\n6. PRECIO: Solo considerar si el usuario mencionó un rango explícito.\n\nREGLA FINAL: El TEMA debe coincidir. Contradicciones duras (modalidad, ciudad, certificado) → NO coincide.\nSi el usuario NO especificó restricciones → solo el tema importa.\n\nRespondé SOLO con JSON sin markdown: {"match":true,"razon":"frase"} o {"match":false,"razon":"por qué no"}`,
          `ALERTA DEL USUARIO:\n${alertaCtx}\n\nPUBLICACIÓN:\n${pubCtx}`,
          120,session.access_token
        );

        let match=false;
        try{
          const j=JSON.parse(raw.match(/\{[\s\S]*?\}/)?.[0]||"{}");
          match=j.match===true;
        }catch{match=raw.includes('"match":true')||raw.includes('"match": true');}

        if(match){
          // Encolar en digest diario
          sb.db("alertas_digest_queue","POST",{
            usuario_email: alerta.usuario_email,
            usuario_id:    alerta.usuario_id||null,
            pub_id:        pub.id||null,
            pub_titulo:    pub.titulo,
            materia:       pub.materia||null,
            tipo:          pub.tipo==="oferta"?"Clase/Curso":"Búsqueda",
            precio:        pub.precio?`$${Number(pub.precio).toLocaleString("es-AR")}`:null,
            modalidad:     pub.modalidad||null,
            criterio_desc: alerta.descripcion||null,
          },session.access_token,"resolution=ignore-duplicates").catch(()=>{});
        }
      }catch{}
    }
  }catch{}
}
