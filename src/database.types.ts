export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alertas_busqueda: {
        Row: {
          activa: boolean | null
          created_at: string | null
          id: string
          materia: string | null
          modo: string | null
          nombre: string
          precio_max: number | null
          tipo: string | null
          ubicacion: string | null
          ultima_notif_at: string | null
          usuario_email: string
          usuario_id: string
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          id?: string
          materia?: string | null
          modo?: string | null
          nombre?: string
          precio_max?: number | null
          tipo?: string | null
          ubicacion?: string | null
          ultima_notif_at?: string | null
          usuario_email: string
          usuario_id: string
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          id?: string
          materia?: string | null
          modo?: string | null
          nombre?: string
          precio_max?: number | null
          tipo?: string | null
          ubicacion?: string | null
          ultima_notif_at?: string | null
          usuario_email?: string
          usuario_id?: string
        }
        Relationships: []
      }
      alertas_busquedas: {
        Row: {
          activa: boolean | null
          created_at: string | null
          email: string
          id: string
          materias: string[]
          modalidad: string | null
          usuario_id: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          materias: string[]
          modalidad?: string | null
          usuario_id?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          materias?: string[]
          modalidad?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_busquedas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "alertas_busquedas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_busquedas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_busquedas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_contacto_externo: {
        Row: {
          autor_email: string
          created_at: string | null
          id: string
          publicacion_id: string | null
          razon: string | null
          revisada: boolean | null
          texto_bloqueado: string
          tipo: string
        }
        Insert: {
          autor_email: string
          created_at?: string | null
          id?: string
          publicacion_id?: string | null
          razon?: string | null
          revisada?: boolean | null
          texto_bloqueado: string
          tipo: string
        }
        Update: {
          autor_email?: string
          created_at?: string | null
          id?: string
          publicacion_id?: string | null
          razon?: string | null
          revisada?: boolean | null
          texto_bloqueado?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_contacto_externo_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_contacto_externo_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_contacto_externo_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_digest_queue: {
        Row: {
          created_at: string | null
          criterio_desc: string | null
          id: string
          materia: string | null
          modalidad: string | null
          precio: string | null
          pub_id: string | null
          pub_titulo: string
          sent_at: string | null
          tipo: string | null
          usuario_email: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          criterio_desc?: string | null
          id?: string
          materia?: string | null
          modalidad?: string | null
          precio?: string | null
          pub_id?: string | null
          pub_titulo: string
          sent_at?: string | null
          tipo?: string | null
          usuario_email: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          criterio_desc?: string | null
          id?: string
          materia?: string | null
          modalidad?: string | null
          precio?: string | null
          pub_id?: string | null
          pub_titulo?: string
          sent_at?: string | null
          tipo?: string | null
          usuario_email?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      alertas_publicacion: {
        Row: {
          activa: boolean | null
          created_at: string | null
          criterios_json: Json | null
          descripcion: string
          id: string
          tipo_alerta: string | null
          total_matches: number | null
          ultima_vez: string | null
          usuario_ciudad: string | null
          usuario_email: string
          usuario_id: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          criterios_json?: Json | null
          descripcion: string
          id?: string
          tipo_alerta?: string | null
          total_matches?: number | null
          ultima_vez?: string | null
          usuario_ciudad?: string | null
          usuario_email: string
          usuario_id?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          criterios_json?: Json | null
          descripcion?: string
          id?: string
          tipo_alerta?: string | null
          total_matches?: number | null
          ultima_vez?: string | null
          usuario_ciudad?: string | null
          usuario_email?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      anuncios_globales: {
        Row: {
          created_at: string | null
          destinatarios: number | null
          enviada_por: string | null
          id: string
          mensaje: string | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          created_at?: string | null
          destinatarios?: number | null
          enviada_por?: string | null
          id?: string
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          created_at?: string | null
          destinatarios?: number | null
          enviada_por?: string | null
          id?: string
          mensaje?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      billetera: {
        Row: {
          id: string
          saldo: number | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          id?: string
          saldo?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          id?: string
          saldo?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billetera_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "billetera_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      billetera_movimientos: {
        Row: {
          clase_realizada_id: string | null
          comision_luderis: number | null
          created_at: string | null
          descripcion: string | null
          estado: string
          id: string
          monto: number | null
          mp_payment_id: string | null
          publicacion_id: string | null
          tipo: string | null
          usuario_id: string | null
        }
        Insert: {
          clase_realizada_id?: string | null
          comision_luderis?: number | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string
          id?: string
          monto?: number | null
          mp_payment_id?: string | null
          publicacion_id?: string | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Update: {
          clase_realizada_id?: string | null
          comision_luderis?: number | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string
          id?: string
          monto?: number | null
          mp_payment_id?: string | null
          publicacion_id?: string | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billetera_movimientos_clase_realizada_id_fkey"
            columns: ["clase_realizada_id"]
            isOneToOne: false
            referencedRelation: "clases_realizadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_movimientos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_movimientos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_movimientos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_movimientos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "billetera_movimientos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_movimientos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billetera_movimientos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      busquedas_recientes: {
        Row: {
          created_at: string | null
          filtros: Json | null
          id: string
          termino: string
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          filtros?: Json | null
          id?: string
          termino: string
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          filtros?: Json | null
          id?: string
          termino?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "busquedas_recientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "busquedas_recientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "busquedas_recientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "busquedas_recientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          icono: string | null
          id: number
          nombre: string
          orden: number | null
          slug: string
        }
        Insert: {
          icono?: string | null
          id?: number
          nombre: string
          orden?: number | null
          slug: string
        }
        Update: {
          icono?: string | null
          id?: number
          nombre?: string
          orden?: number | null
          slug?: string
        }
        Relationships: []
      }
      certificados: {
        Row: {
          alumno_email: string
          alumno_nombre: string | null
          curso_id: string | null
          curso_titulo: string | null
          docente_email: string | null
          docente_nombre: string | null
          fecha_emision: string | null
          id: string
          materia: string | null
        }
        Insert: {
          alumno_email: string
          alumno_nombre?: string | null
          curso_id?: string | null
          curso_titulo?: string | null
          docente_email?: string | null
          docente_nombre?: string | null
          fecha_emision?: string | null
          id: string
          materia?: string | null
        }
        Update: {
          alumno_email?: string
          alumno_nombre?: string | null
          curso_id?: string | null
          curso_titulo?: string | null
          docente_email?: string | null
          docente_nombre?: string | null
          fecha_emision?: string | null
          id?: string
          materia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      clases_realizadas: {
        Row: {
          acuerdo_id: string | null
          alumno_email: string
          confirmada_at: string | null
          confirmado_alumno: boolean | null
          confirmado_docente: boolean | null
          created_at: string | null
          docente_email: string
          duracion_min: number | null
          fecha_clase: string
          id: string
          notas: string | null
          publicacion_id: string | null
        }
        Insert: {
          acuerdo_id?: string | null
          alumno_email: string
          confirmada_at?: string | null
          confirmado_alumno?: boolean | null
          confirmado_docente?: boolean | null
          created_at?: string | null
          docente_email: string
          duracion_min?: number | null
          fecha_clase: string
          id?: string
          notas?: string | null
          publicacion_id?: string | null
        }
        Update: {
          acuerdo_id?: string | null
          alumno_email?: string
          confirmada_at?: string | null
          confirmado_alumno?: boolean | null
          confirmado_docente?: boolean | null
          created_at?: string | null
          docente_email?: string
          duracion_min?: number | null
          fecha_clase?: string
          id?: string
          notas?: string | null
          publicacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clases_realizadas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_realizadas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_realizadas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          actualizado_por: string | null
          clave: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          actualizado_por?: string | null
          clave: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          actualizado_por?: string | null
          clave?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      contenido_curso: {
        Row: {
          created_at: string | null
          id: string
          orden: number | null
          publicacion_id: string
          solo_inscriptos: boolean | null
          texto: string | null
          tipo: string | null
          titulo: string | null
          url: string | null
          visible: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          orden?: number | null
          publicacion_id: string
          solo_inscriptos?: boolean | null
          texto?: string | null
          tipo?: string | null
          titulo?: string | null
          url?: string | null
          visible?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          orden?: number | null
          publicacion_id?: string
          solo_inscriptos?: boolean | null
          texto?: string | null
          tipo?: string | null
          titulo?: string | null
          url?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contenido_curso_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_curso_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_curso_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      denuncias: {
        Row: {
          accion_tomada: string | null
          autor_email: string | null
          created_at: string | null
          denunciado_email: string | null
          denunciante_email: string | null
          denunciante_id: string
          detalle: string | null
          estado: string | null
          id: string
          motivo: string
          publicacion_id: string
          revisada: boolean | null
        }
        Insert: {
          accion_tomada?: string | null
          autor_email?: string | null
          created_at?: string | null
          denunciado_email?: string | null
          denunciante_email?: string | null
          denunciante_id: string
          detalle?: string | null
          estado?: string | null
          id?: string
          motivo: string
          publicacion_id: string
          revisada?: boolean | null
        }
        Update: {
          accion_tomada?: string | null
          autor_email?: string | null
          created_at?: string | null
          denunciado_email?: string | null
          denunciante_email?: string | null
          denunciante_id?: string
          detalle?: string | null
          estado?: string | null
          id?: string
          motivo?: string
          publicacion_id?: string
          revisada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "denuncias_denunciante_id_fkey"
            columns: ["denunciante_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "denuncias_denunciante_id_fkey"
            columns: ["denunciante_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denuncias_denunciante_id_fkey"
            columns: ["denunciante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denuncias_denunciante_id_fkey"
            columns: ["denunciante_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denuncias_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denuncias_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "denuncias_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      disputas: {
        Row: {
          admin_email: string | null
          alumno_email: string
          created_at: string
          descripcion: string | null
          docente_email: string
          estado: string
          id: string
          inscripcion_id: string | null
          motivo: string
          pago_id: string
          resolucion: string | null
          resuelto_at: string | null
          updated_at: string
        }
        Insert: {
          admin_email?: string | null
          alumno_email: string
          created_at?: string
          descripcion?: string | null
          docente_email: string
          estado?: string
          id?: string
          inscripcion_id?: string | null
          motivo: string
          pago_id: string
          resolucion?: string | null
          resuelto_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_email?: string | null
          alumno_email?: string
          created_at?: string
          descripcion?: string | null
          docente_email?: string
          estado?: string
          id?: string
          inscripcion_id?: string | null
          motivo?: string
          pago_id?: string
          resolucion?: string | null
          resuelto_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputas_pago_id_fkey"
            columns: ["pago_id"]
            isOneToOne: false
            referencedRelation: "pagos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          anio: string | null
          año: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          institucion: string | null
          pais: string | null
          tipo: string | null
          titulo: string
          url_imagen: string | null
          url_verificacion: string | null
          usuario_email: string | null
          usuario_id: string
          verificado: boolean | null
        }
        Insert: {
          anio?: string | null
          año?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          institucion?: string | null
          pais?: string | null
          tipo?: string | null
          titulo: string
          url_imagen?: string | null
          url_verificacion?: string | null
          usuario_email?: string | null
          usuario_id: string
          verificado?: boolean | null
        }
        Update: {
          anio?: string | null
          año?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          institucion?: string | null
          pais?: string | null
          tipo?: string | null
          titulo?: string
          url_imagen?: string | null
          url_verificacion?: string | null
          usuario_email?: string | null
          usuario_id?: string
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "documentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluacion_entregas: {
        Row: {
          alumno_email: string
          corregido: boolean | null
          created_at: string | null
          evaluacion_id: string | null
          feedback: string | null
          id: string
          nota: number | null
          publicacion_id: string | null
          respuesta_json: string | null
          score_auto: number | null
        }
        Insert: {
          alumno_email: string
          corregido?: boolean | null
          created_at?: string | null
          evaluacion_id?: string | null
          feedback?: string | null
          id?: string
          nota?: number | null
          publicacion_id?: string | null
          respuesta_json?: string | null
          score_auto?: number | null
        }
        Update: {
          alumno_email?: string
          corregido?: boolean | null
          created_at?: string | null
          evaluacion_id?: string | null
          feedback?: string | null
          id?: string
          nota?: number | null
          publicacion_id?: string | null
          respuesta_json?: string | null
          score_auto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_entregas_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_entregas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_entregas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_entregas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          activo: boolean | null
          contenido_json: string | null
          created_at: string | null
          formato: string | null
          generado_ia: boolean | null
          id: string
          publicacion_id: string | null
          skill_ids: string[] | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          activo?: boolean | null
          contenido_json?: string | null
          created_at?: string | null
          formato?: string | null
          generado_ia?: boolean | null
          id?: string
          publicacion_id?: string | null
          skill_ids?: string[] | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          activo?: boolean | null
          contenido_json?: string | null
          created_at?: string | null
          formato?: string | null
          generado_ia?: boolean | null
          id?: string
          publicacion_id?: string | null
          skill_ids?: string[] | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          created_at: string | null
          id: string
          publicacion_id: string
          usuario_email: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          publicacion_id: string
          usuario_email?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          publicacion_id?: string
          usuario_email?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_revisiones: {
        Row: {
          alumno_email: string
          card_index: number
          contenido_id: string
          created_at: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          last_reviewed_at: string | null
          next_review_at: string | null
          repeticiones: number | null
        }
        Insert: {
          alumno_email: string
          card_index: number
          contenido_id: string
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repeticiones?: number | null
        }
        Update: {
          alumno_email?: string
          card_index?: number
          contenido_id?: string
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string | null
          repeticiones?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_revisiones_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido_curso"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_posts: {
        Row: {
          autor_email: string | null
          autor_nombre: string | null
          created_at: string | null
          id: string
          materia: string | null
          publicacion_id: string | null
          respuestas_count: number | null
          texto: string | null
        }
        Insert: {
          autor_email?: string | null
          autor_nombre?: string | null
          created_at?: string | null
          id?: string
          materia?: string | null
          publicacion_id?: string | null
          respuestas_count?: number | null
          texto?: string | null
        }
        Update: {
          autor_email?: string | null
          autor_nombre?: string | null
          created_at?: string | null
          id?: string
          materia?: string | null
          publicacion_id?: string | null
          respuestas_count?: number | null
          texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_posts_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foro_posts_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foro_posts_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      foro_respuestas: {
        Row: {
          autor_email: string | null
          autor_nombre: string | null
          created_at: string | null
          foro_post_id: string | null
          id: string
          publicacion_id: string | null
          texto: string | null
        }
        Insert: {
          autor_email?: string | null
          autor_nombre?: string | null
          created_at?: string | null
          foro_post_id?: string | null
          id?: string
          publicacion_id?: string | null
          texto?: string | null
        }
        Update: {
          autor_email?: string | null
          autor_nombre?: string | null
          created_at?: string | null
          foro_post_id?: string | null
          id?: string
          publicacion_id?: string | null
          texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foro_respuestas_foro_post_id_fkey"
            columns: ["foro_post_id"]
            isOneToOne: false
            referencedRelation: "foro_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      inscripciones: {
        Row: {
          alumno_confirmada: boolean | null
          alumno_confirmada_at: string | null
          alumno_email: string | null
          alumno_id: string
          cancelado_por: string | null
          clase_finalizada: boolean | null
          clase_finalizada_at: string | null
          clases_restantes: number | null
          clases_totales: number | null
          created_at: string | null
          es_prueba: boolean | null
          estado: string | null
          fecha_finalizacion: string | null
          id: string
          motivo_cancelacion: string | null
          mp_payment_id: string | null
          pagado_mp: boolean | null
          precio_por_clase: number | null
          publicacion_id: string
          valorado: boolean | null
        }
        Insert: {
          alumno_confirmada?: boolean | null
          alumno_confirmada_at?: string | null
          alumno_email?: string | null
          alumno_id: string
          cancelado_por?: string | null
          clase_finalizada?: boolean | null
          clase_finalizada_at?: string | null
          clases_restantes?: number | null
          clases_totales?: number | null
          created_at?: string | null
          es_prueba?: boolean | null
          estado?: string | null
          fecha_finalizacion?: string | null
          id?: string
          motivo_cancelacion?: string | null
          mp_payment_id?: string | null
          pagado_mp?: boolean | null
          precio_por_clase?: number | null
          publicacion_id: string
          valorado?: boolean | null
        }
        Update: {
          alumno_confirmada?: boolean | null
          alumno_confirmada_at?: string | null
          alumno_email?: string | null
          alumno_id?: string
          cancelado_por?: string | null
          clase_finalizada?: boolean | null
          clase_finalizada_at?: string | null
          clases_restantes?: number | null
          clases_totales?: number | null
          created_at?: string | null
          es_prueba?: boolean | null
          estado?: string | null
          fecha_finalizacion?: string | null
          id?: string
          motivo_cancelacion?: string | null
          mp_payment_id?: string | null
          pagado_mp?: boolean | null
          precio_por_clase?: number | null
          publicacion_id?: string
          valorado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "inscripciones_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_alumno_id_fkey"
            columns: ["alumno_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      liquidaciones: {
        Row: {
          cantidad_clases: number
          comision_luderis: number
          created_at: string
          docente_email: string
          id: string
          monto_bruto: number
          monto_neto: number
          pdf_url: string | null
          periodo: string
        }
        Insert: {
          cantidad_clases?: number
          comision_luderis: number
          created_at?: string
          docente_email: string
          id?: string
          monto_bruto: number
          monto_neto: number
          pdf_url?: string | null
          periodo: string
        }
        Update: {
          cantidad_clases?: number
          comision_luderis?: number
          created_at?: string
          docente_email?: string
          id?: string
          monto_bruto?: number
          monto_neto?: number
          pdf_url?: string | null
          periodo?: string
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          created_at: string | null
          de_nombre: string | null
          de_usuario: string | null
          editado: boolean | null
          editado_at: string | null
          id: string
          leido: boolean | null
          leido_at: string | null
          para_nombre: string | null
          para_usuario: string | null
          pub_titulo: string | null
          publicacion_id: string | null
          texto: string
        }
        Insert: {
          created_at?: string | null
          de_nombre?: string | null
          de_usuario?: string | null
          editado?: boolean | null
          editado_at?: string | null
          id?: string
          leido?: boolean | null
          leido_at?: string | null
          para_nombre?: string | null
          para_usuario?: string | null
          pub_titulo?: string | null
          publicacion_id?: string | null
          texto: string
        }
        Update: {
          created_at?: string | null
          de_nombre?: string | null
          de_usuario?: string | null
          editado?: boolean | null
          editado_at?: string | null
          id?: string
          leido?: boolean | null
          leido_at?: string | null
          para_nombre?: string | null
          para_usuario?: string | null
          pub_titulo?: string | null
          publicacion_id?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_de_usuario_fkey"
            columns: ["de_usuario"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "mensajes_de_usuario_fkey"
            columns: ["de_usuario"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_de_usuario_fkey"
            columns: ["de_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_de_usuario_fkey"
            columns: ["de_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_para_usuario_fkey"
            columns: ["para_usuario"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "mensajes_para_usuario_fkey"
            columns: ["para_usuario"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_para_usuario_fkey"
            columns: ["para_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_para_usuario_fkey"
            columns: ["para_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_conexiones: {
        Row: {
          connected_at: string
          id: string
          mp_access_token: string
          mp_email: string | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          mp_user_id: string
          updated_at: string
          usuario_email: string
          usuario_id: string
        }
        Insert: {
          connected_at?: string
          id?: string
          mp_access_token: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id: string
          updated_at?: string
          usuario_email: string
          usuario_id: string
        }
        Update: {
          connected_at?: string
          id?: string
          mp_access_token?: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: string
          updated_at?: string
          usuario_email?: string
          usuario_id?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          accion_url: string | null
          alumno_email: string | null
          created_at: string | null
          id: string
          leida: boolean | null
          metadata: Json | null
          pub_titulo: string | null
          publicacion_id: string | null
          tipo: string | null
          usuario_id: string | null
        }
        Insert: {
          accion_url?: string | null
          alumno_email?: string | null
          created_at?: string | null
          id?: string
          leida?: boolean | null
          metadata?: Json | null
          pub_titulo?: string | null
          publicacion_id?: string | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion_url?: string | null
          alumno_email?: string | null
          created_at?: string | null
          id?: string
          leida?: boolean | null
          metadata?: Json | null
          pub_titulo?: string | null
          publicacion_id?: string | null
          tipo?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas_busqueda: {
        Row: {
          acuerdo_confirmado: boolean | null
          acuerdo_fecha: string | null
          busqueda_autor_email: string | null
          busqueda_id: string
          busqueda_materia: string | null
          busqueda_titulo: string | null
          contraoferta_de: string | null
          contraoferta_mensaje: string | null
          contraoferta_precio: number | null
          contraoferta_tipo: string | null
          created_at: string | null
          estado: string | null
          finalizada_cuenta: boolean | null
          forma_pago: string | null
          frecuencia: string | null
          id: string
          leida: boolean | null
          mensaje: string | null
          notas_acuerdo: string | null
          ofertante_email: string | null
          ofertante_id: string
          ofertante_nombre: string | null
          precio: number | null
          precio_tipo: string | null
          updated_at: string | null
        }
        Insert: {
          acuerdo_confirmado?: boolean | null
          acuerdo_fecha?: string | null
          busqueda_autor_email?: string | null
          busqueda_id: string
          busqueda_materia?: string | null
          busqueda_titulo?: string | null
          contraoferta_de?: string | null
          contraoferta_mensaje?: string | null
          contraoferta_precio?: number | null
          contraoferta_tipo?: string | null
          created_at?: string | null
          estado?: string | null
          finalizada_cuenta?: boolean | null
          forma_pago?: string | null
          frecuencia?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          notas_acuerdo?: string | null
          ofertante_email?: string | null
          ofertante_id: string
          ofertante_nombre?: string | null
          precio?: number | null
          precio_tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          acuerdo_confirmado?: boolean | null
          acuerdo_fecha?: string | null
          busqueda_autor_email?: string | null
          busqueda_id?: string
          busqueda_materia?: string | null
          busqueda_titulo?: string | null
          contraoferta_de?: string | null
          contraoferta_mensaje?: string | null
          contraoferta_precio?: number | null
          contraoferta_tipo?: string | null
          created_at?: string | null
          estado?: string | null
          finalizada_cuenta?: boolean | null
          forma_pago?: string | null
          frecuencia?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          notas_acuerdo?: string | null
          ofertante_email?: string | null
          ofertante_id?: string
          ofertante_nombre?: string | null
          precio?: number | null
          precio_tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_busqueda_busqueda_id_fkey"
            columns: ["busqueda_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_busqueda_busqueda_id_fkey"
            columns: ["busqueda_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_busqueda_busqueda_id_fkey"
            columns: ["busqueda_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_busqueda_ofertante_id_fkey"
            columns: ["ofertante_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "ofertas_busqueda_ofertante_id_fkey"
            columns: ["ofertante_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_busqueda_ofertante_id_fkey"
            columns: ["ofertante_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_busqueda_ofertante_id_fkey"
            columns: ["ofertante_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          alumno_email: string | null
          clase_finalizada_at: string | null
          created_at: string | null
          docente_email: string | null
          estado: string | null
          estado_escrow: string | null
          id: string
          liberado_at: string | null
          modo: string | null
          monto: number | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          publicacion_id: string | null
          raw_data: Json | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          alumno_email?: string | null
          clase_finalizada_at?: string | null
          created_at?: string | null
          docente_email?: string | null
          estado?: string | null
          estado_escrow?: string | null
          id?: string
          liberado_at?: string | null
          modo?: string | null
          monto?: number | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          publicacion_id?: string | null
          raw_data?: Json | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          alumno_email?: string | null
          clase_finalizada_at?: string | null
          created_at?: string | null
          docente_email?: string | null
          estado?: string | null
          estado_escrow?: string | null
          id?: string
          liberado_at?: string | null
          modo?: string | null
          monto?: number | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          publicacion_id?: string | null
          raw_data?: Json | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      preguntas_publicacion: {
        Row: {
          autor_email: string
          autor_nombre: string | null
          created_at: string | null
          flag_pregunta: boolean | null
          flag_razon: string | null
          flag_respuesta: boolean | null
          id: string
          pregunta: string
          publicacion_id: string
          respondido_at: string | null
          respuesta: string | null
        }
        Insert: {
          autor_email: string
          autor_nombre?: string | null
          created_at?: string | null
          flag_pregunta?: boolean | null
          flag_razon?: string | null
          flag_respuesta?: boolean | null
          id?: string
          pregunta: string
          publicacion_id: string
          respondido_at?: string | null
          respuesta?: string | null
        }
        Update: {
          autor_email?: string
          autor_nombre?: string | null
          created_at?: string | null
          flag_pregunta?: boolean | null
          flag_razon?: string | null
          flag_respuesta?: boolean | null
          id?: string
          pregunta?: string
          publicacion_id?: string
          respondido_at?: string | null
          respuesta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_publicacion_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_publicacion_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preguntas_publicacion_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      progreso_modulos: {
        Row: {
          alumno_email: string
          completado: boolean | null
          completado_at: string | null
          contenido_id: string
          created_at: string | null
          id: string
          publicacion_id: string
        }
        Insert: {
          alumno_email: string
          completado?: boolean | null
          completado_at?: string | null
          contenido_id: string
          created_at?: string | null
          id?: string
          publicacion_id: string
        }
        Update: {
          alumno_email?: string
          completado?: boolean | null
          completado_at?: string | null
          contenido_id?: string
          created_at?: string | null
          id?: string
          publicacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progreso_modulos_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido_curso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_modulos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_modulos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_modulos_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones: {
        Row: {
          activo: boolean | null
          aprobacion_pct: number | null
          autor_id: string
          ayudantes: string[] | null
          banner_url: string | null
          calificacion_promedio: number | null
          cantidad_inscriptos: number | null
          cantidad_reseñas: number | null
          categoria_id: number | null
          clases_sinc: string | null
          clicks_contacto: number | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          dias_clases: string | null
          duracion_clase: string | null
          duracion_curso: string | null
          estado_validacion: string | null
          expires_at: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          finalizado: boolean | null
          frecuencia: string | null
          horario: string | null
          id: string
          idioma: string | null
          inscripciones_cerradas: boolean | null
          materia: string | null
          max_alumnos: number | null
          modalidad: string | null
          modo: string | null
          moneda: string | null
          nivel: string | null
          otorga_certificado: boolean | null
          paquetes: string | null
          plataforma: string | null
          precio: number | null
          precio_prueba: number | null
          precio_tipo: string | null
          requisitos: string | null
          sinc: string | null
          tiene_prueba: boolean | null
          tipo: string
          titulo: string
          ubicacion: string | null
          updated_at: string | null
          verificado: boolean | null
          vistas: number | null
        }
        Insert: {
          activo?: boolean | null
          aprobacion_pct?: number | null
          autor_id: string
          ayudantes?: string[] | null
          banner_url?: string | null
          calificacion_promedio?: number | null
          cantidad_inscriptos?: number | null
          cantidad_reseñas?: number | null
          categoria_id?: number | null
          clases_sinc?: string | null
          clicks_contacto?: number | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          dias_clases?: string | null
          duracion_clase?: string | null
          duracion_curso?: string | null
          estado_validacion?: string | null
          expires_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          finalizado?: boolean | null
          frecuencia?: string | null
          horario?: string | null
          id?: string
          idioma?: string | null
          inscripciones_cerradas?: boolean | null
          materia?: string | null
          max_alumnos?: number | null
          modalidad?: string | null
          modo?: string | null
          moneda?: string | null
          nivel?: string | null
          otorga_certificado?: boolean | null
          paquetes?: string | null
          plataforma?: string | null
          precio?: number | null
          precio_prueba?: number | null
          precio_tipo?: string | null
          requisitos?: string | null
          sinc?: string | null
          tiene_prueba?: boolean | null
          tipo: string
          titulo: string
          ubicacion?: string | null
          updated_at?: string | null
          verificado?: boolean | null
          vistas?: number | null
        }
        Update: {
          activo?: boolean | null
          aprobacion_pct?: number | null
          autor_id?: string
          ayudantes?: string[] | null
          banner_url?: string | null
          calificacion_promedio?: number | null
          cantidad_inscriptos?: number | null
          cantidad_reseñas?: number | null
          categoria_id?: number | null
          clases_sinc?: string | null
          clicks_contacto?: number | null
          created_at?: string | null
          descripcion?: string | null
          destacado?: boolean | null
          dias_clases?: string | null
          duracion_clase?: string | null
          duracion_curso?: string | null
          estado_validacion?: string | null
          expires_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          finalizado?: boolean | null
          frecuencia?: string | null
          horario?: string | null
          id?: string
          idioma?: string | null
          inscripciones_cerradas?: boolean | null
          materia?: string | null
          max_alumnos?: number | null
          modalidad?: string | null
          modo?: string | null
          moneda?: string | null
          nivel?: string | null
          otorga_certificado?: boolean | null
          paquetes?: string | null
          plataforma?: string | null
          precio?: number | null
          precio_prueba?: number | null
          precio_tipo?: string | null
          requisitos?: string | null
          sinc?: string | null
          tiene_prueba?: boolean | null
          tipo?: string
          titulo?: string
          ubicacion?: string | null
          updated_at?: string | null
          verificado?: boolean | null
          vistas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          subscription: Json
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscription: Json
          user_email: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscription?: Json
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      puzzle_results: {
        Row: {
          completed_at: string | null
          id: string
          puzzle_id: string
          time_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          puzzle_id: string
          time_seconds: number
          user_id?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          puzzle_id?: string
          time_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puzzle_results_puzzle_id_fkey"
            columns: ["puzzle_id"]
            isOneToOne: false
            referencedRelation: "puzzles"
            referencedColumns: ["id"]
          },
        ]
      }
      puzzles: {
        Row: {
          created_at: string | null
          date: string
          difficulty: string
          grid_size: number
          hints: Json
          id: string
          regions: Json
          solution: Json
        }
        Insert: {
          created_at?: string | null
          date: string
          difficulty: string
          grid_size: number
          hints: Json
          id?: string
          regions: Json
          solution: Json
        }
        Update: {
          created_at?: string | null
          date?: string
          difficulty?: string
          grid_size?: number
          hints?: Json
          id?: string
          regions?: Json
          solution?: Json
        }
        Relationships: []
      }
      quejas: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string
          email: string
          estado: string
          id: string
          nombre: string
          numero_queja: string
          referencia: string | null
          rol: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion: string
          email: string
          estado?: string
          id?: string
          nombre: string
          numero_queja: string
          referencia?: string | null
          rol: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          email?: string
          estado?: string
          id?: string
          nombre?: string
          numero_queja?: string
          referencia?: string | null
          rol?: string
        }
        Relationships: []
      }
      quiz_entregas: {
        Row: {
          alumno_email: string
          corregido: boolean | null
          created_at: string | null
          id: string
          nota: number | null
          publicacion_id: string | null
          quiz_id: string
          resultado_json: string | null
          texto_entrega: string | null
          tipo: string | null
        }
        Insert: {
          alumno_email: string
          corregido?: boolean | null
          created_at?: string | null
          id?: string
          nota?: number | null
          publicacion_id?: string | null
          quiz_id: string
          resultado_json?: string | null
          texto_entrega?: string | null
          tipo?: string | null
        }
        Update: {
          alumno_email?: string
          corregido?: boolean | null
          created_at?: string | null
          id?: string
          nota?: number | null
          publicacion_id?: string | null
          quiz_id?: string
          resultado_json?: string | null
          texto_entrega?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_entregas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_entregas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_entregas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_entregas_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "contenido_curso"
            referencedColumns: ["id"]
          },
        ]
      }
      referidos: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          referido_email: string | null
          referido_id: string | null
          referidor_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          referido_email?: string | null
          referido_id?: string | null
          referidor_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          referido_email?: string | null
          referido_id?: string | null
          referidor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referidos_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: true
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "referidos_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: true
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: true
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "referidos_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      reseñas: {
        Row: {
          autor_avatar: string | null
          autor_email: string | null
          autor_id: string
          autor_nombre: string | null
          clase_realizada_id: string | null
          created_at: string | null
          estrellas: number
          id: string
          publicacion_id: string
          respuesta: string | null
          respuesta_at: string | null
          texto: string | null
          updated_at: string | null
          verificada: boolean | null
        }
        Insert: {
          autor_avatar?: string | null
          autor_email?: string | null
          autor_id: string
          autor_nombre?: string | null
          clase_realizada_id?: string | null
          created_at?: string | null
          estrellas?: number
          id?: string
          publicacion_id: string
          respuesta?: string | null
          respuesta_at?: string | null
          texto?: string | null
          updated_at?: string | null
          verificada?: boolean | null
        }
        Update: {
          autor_avatar?: string | null
          autor_email?: string | null
          autor_id?: string
          autor_nombre?: string | null
          clase_realizada_id?: string | null
          created_at?: string | null
          estrellas?: number
          id?: string
          publicacion_id?: string
          respuesta?: string | null
          respuesta_at?: string | null
          texto?: string | null
          updated_at?: string | null
          verificada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reseñas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "reseñas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseñas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseñas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseñas_clase_realizada_id_fkey"
            columns: ["clase_realizada_id"]
            isOneToOne: false
            referencedRelation: "clases_realizadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseñas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseñas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reseñas_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      shikaku_results: {
        Row: {
          completed_at: string | null
          id: string
          puzzle_date: string
          time_seconds: number | null
          usuario_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          puzzle_date: string
          time_seconds?: number | null
          usuario_id?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          puzzle_date?: string
          time_seconds?: number | null
          usuario_id?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          orden: number | null
          peso: number | null
          publicacion_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          orden?: number | null
          peso?: number | null
          publicacion_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          peso?: number | null
          publicacion_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_retiro: {
        Row: {
          cbu_alias: string
          created_at: string | null
          email: string
          estado: string
          id: string
          monto: number
          nombre: string | null
          notas_admin: string | null
          procesado_at: string | null
          titular: string
          usuario_id: string | null
        }
        Insert: {
          cbu_alias: string
          created_at?: string | null
          email: string
          estado?: string
          id?: string
          monto: number
          nombre?: string | null
          notas_admin?: string | null
          procesado_at?: string | null
          titular: string
          usuario_id?: string | null
        }
        Update: {
          cbu_alias?: string
          created_at?: string | null
          email?: string
          estado?: string
          id?: string
          monto?: number
          nombre?: string | null
          notas_admin?: string | null
          procesado_at?: string | null
          titular?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_retiro_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "solicitudes_retiro_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_retiro_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_retiro_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_levels: {
        Row: {
          id: string
          nivel_actual: number | null
          nivel_inicial: number | null
          skill_id: string | null
          source: string | null
          updated_at: string | null
          usuario_email: string
        }
        Insert: {
          id?: string
          nivel_actual?: number | null
          nivel_inicial?: number | null
          skill_id?: string | null
          source?: string | null
          updated_at?: string | null
          usuario_email: string
        }
        Update: {
          id?: string
          nivel_actual?: number | null
          nivel_inicial?: number | null
          skill_id?: string | null
          source?: string | null
          updated_at?: string | null
          usuario_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skill_levels_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean | null
          advertencias: number
          anios_experiencia: number | null
          avatar: string | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          bloqueado: boolean | null
          calificaciones_count: number | null
          calificaciones_suma: number | null
          created_at: string | null
          dias_racha: number
          display_name: string | null
          disponible_ahora: boolean | null
          disponible_hasta: string | null
          disponible_mensaje: string | null
          email: string | null
          franja_horaria: string | null
          id: string
          idiomas: string[] | null
          linkedin_url: string | null
          materias: string[] | null
          materias_interes: string[] | null
          metodologia: string | null
          mp_access_token: string | null
          mp_connected_at: string | null
          mp_email: string | null
          mp_refresh_token: string | null
          mp_user_id: number | null
          nivel: string | null
          nivel_educativo: string | null
          nombre: string
          objetivo: string | null
          onboarding_completado: boolean | null
          recordatorios_activos: boolean | null
          referido_por: string | null
          rol: string | null
          sitio_web: string | null
          titulo_profesional: string | null
          ubicacion: string | null
          ultimo_acceso: string | null
          updated_at: string | null
          verificado: boolean | null
          video_presentacion: string | null
        }
        Insert: {
          activo?: boolean | null
          advertencias?: number
          anios_experiencia?: number | null
          avatar?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          bloqueado?: boolean | null
          calificaciones_count?: number | null
          calificaciones_suma?: number | null
          created_at?: string | null
          dias_racha?: number
          display_name?: string | null
          disponible_ahora?: boolean | null
          disponible_hasta?: string | null
          disponible_mensaje?: string | null
          email?: string | null
          franja_horaria?: string | null
          id: string
          idiomas?: string[] | null
          linkedin_url?: string | null
          materias?: string[] | null
          materias_interes?: string[] | null
          metodologia?: string | null
          mp_access_token?: string | null
          mp_connected_at?: string | null
          mp_email?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: number | null
          nivel?: string | null
          nivel_educativo?: string | null
          nombre: string
          objetivo?: string | null
          onboarding_completado?: boolean | null
          recordatorios_activos?: boolean | null
          referido_por?: string | null
          rol?: string | null
          sitio_web?: string | null
          titulo_profesional?: string | null
          ubicacion?: string | null
          ultimo_acceso?: string | null
          updated_at?: string | null
          verificado?: boolean | null
          video_presentacion?: string | null
        }
        Update: {
          activo?: boolean | null
          advertencias?: number
          anios_experiencia?: number | null
          avatar?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          bloqueado?: boolean | null
          calificaciones_count?: number | null
          calificaciones_suma?: number | null
          created_at?: string | null
          dias_racha?: number
          display_name?: string | null
          disponible_ahora?: boolean | null
          disponible_hasta?: string | null
          disponible_mensaje?: string | null
          email?: string | null
          franja_horaria?: string | null
          id?: string
          idiomas?: string[] | null
          linkedin_url?: string | null
          materias?: string[] | null
          materias_interes?: string[] | null
          metodologia?: string | null
          mp_access_token?: string | null
          mp_connected_at?: string | null
          mp_email?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: number | null
          nivel?: string | null
          nivel_educativo?: string | null
          nombre?: string
          objetivo?: string | null
          onboarding_completado?: boolean | null
          recordatorios_activos?: boolean | null
          referido_por?: string | null
          rol?: string | null
          sitio_web?: string | null
          titulo_profesional?: string | null
          ubicacion?: string | null
          ultimo_acceso?: string | null
          updated_at?: string | null
          verificado?: boolean | null
          video_presentacion?: string | null
        }
        Relationships: []
      }
      verificaciones_usuario: {
        Row: {
          created_at: string | null
          cuit: string | null
          dni: string | null
          es_pep: boolean | null
          estado: string | null
          fecha_nacimiento: string | null
          foto_dni_dorso: string | null
          foto_dni_frente: string | null
          id: string
          razon_rechazo: string | null
          revisado_at: string | null
          revisado_por: string | null
          situacion_fiscal: string | null
          terminos_aceptados: boolean | null
          terminos_fecha: string | null
          updated_at: string | null
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          cuit?: string | null
          dni?: string | null
          es_pep?: boolean | null
          estado?: string | null
          fecha_nacimiento?: string | null
          foto_dni_dorso?: string | null
          foto_dni_frente?: string | null
          id?: string
          razon_rechazo?: string | null
          revisado_at?: string | null
          revisado_por?: string | null
          situacion_fiscal?: string | null
          terminos_aceptados?: boolean | null
          terminos_fecha?: string | null
          updated_at?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          cuit?: string | null
          dni?: string | null
          es_pep?: boolean | null
          estado?: string | null
          fecha_nacimiento?: string | null
          foto_dni_dorso?: string | null
          foto_dni_frente?: string | null
          id?: string
          razon_rechazo?: string | null
          revisado_at?: string | null
          revisado_por?: string | null
          situacion_fiscal?: string | null
          terminos_aceptados?: boolean | null
          terminos_fecha?: string | null
          updated_at?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      conversaciones: {
        Row: {
          de_nombre: string | null
          para_nombre: string | null
          pub_titulo: string | null
          publicacion_id: string | null
          ultimo_at: string | null
          ultimo_mensaje: string | null
          ultimo_mensaje_id: string | null
          usuario_a: string | null
          usuario_b: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_con_autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_publicacion_id_fkey"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicaciones_publicas"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_docente: {
        Row: {
          autor_email: string | null
          autor_id: string | null
          clases_realizadas: number | null
          rating_promedio: number | null
          total_clicks: number | null
          total_inscriptos: number | null
          total_publicaciones: number | null
          total_reseñas: number | null
          total_vistas: number | null
        }
        Relationships: []
      }
      mp_conexiones_public: {
        Row: {
          connected_at: string | null
          id: string | null
          mp_email: string | null
          mp_public_key: string | null
          mp_user_id: string | null
          updated_at: string | null
          usuario_email: string | null
          usuario_id: string | null
        }
        Insert: {
          connected_at?: string | null
          id?: string | null
          mp_email?: string | null
          mp_public_key?: string | null
          mp_user_id?: string | null
          updated_at?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Update: {
          connected_at?: string | null
          id?: string | null
          mp_email?: string | null
          mp_public_key?: string | null
          mp_user_id?: string | null
          updated_at?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      mp_connect_status: {
        Row: {
          email: string | null
          id: string | null
          mp_connected: boolean | null
          mp_connected_at: string | null
          mp_email: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          mp_connected?: never
          mp_connected_at?: string | null
          mp_email?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
          mp_connected?: never
          mp_connected_at?: string | null
          mp_email?: string | null
        }
        Relationships: []
      }
      publicaciones_con_autor: {
        Row: {
          activo: boolean | null
          autor_avatar_url: string | null
          autor_display_name: string | null
          autor_email: string | null
          autor_id: string | null
          autor_nombre: string | null
          autor_ubicacion: string | null
          ayudantes: string[] | null
          banner_url: string | null
          calificacion_promedio: number | null
          cantidad_inscriptos: number | null
          cantidad_reseñas: number | null
          categoria_id: number | null
          clases_sinc: string | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          dias_clases: string | null
          duracion_clase: string | null
          duracion_curso: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          finalizado: boolean | null
          frecuencia: string | null
          horario: string | null
          id: string | null
          idioma: string | null
          inscripciones_cerradas: boolean | null
          materia: string | null
          max_alumnos: number | null
          modalidad: string | null
          modo: string | null
          moneda: string | null
          nivel: string | null
          otorga_certificado: boolean | null
          paquetes: string | null
          plataforma: string | null
          precio: number | null
          precio_prueba: number | null
          precio_tipo: string | null
          requisitos: string | null
          sinc: string | null
          tiene_prueba: boolean | null
          tipo: string | null
          titulo: string | null
          ubicacion: string | null
          updated_at: string | null
          verificado: boolean | null
          vistas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      publicaciones_publicas: {
        Row: {
          activo: boolean | null
          autor_avatar: string | null
          autor_id: string | null
          autor_nombre: string | null
          autor_ubicacion: string | null
          calificacion_promedio: number | null
          cantidad_inscriptos: number | null
          cantidad_reseñas: number | null
          categoria_icono: string | null
          categoria_nombre: string | null
          categoria_slug: string | null
          created_at: string | null
          descripcion: string | null
          destacado: boolean | null
          dias_clases: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          finalizado: boolean | null
          horario: string | null
          id: string | null
          materia: string | null
          modalidad: string | null
          modo: string | null
          moneda: string | null
          plataforma: string | null
          precio: number | null
          precio_tipo: string | null
          tipo: string | null
          titulo: string | null
          ubicacion: string | null
          updated_at: string | null
          verificado: boolean | null
          vistas: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "metricas_docente"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "mp_connect_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicaciones_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios_con_rating"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_con_rating: {
        Row: {
          avatar: string | null
          bio: string | null
          cantidad_publicaciones: number | null
          cantidad_reseñas: number | null
          created_at: string | null
          email: string | null
          id: string | null
          nombre_publico: string | null
          ubicacion: string | null
          valoracion_usuario: number | null
          verificado: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      actualizar_streak: { Args: { p_usuario_id: string }; Returns: number }
      buscar_publicaciones: {
        Args: {
          p_categoria?: string
          p_limit?: number
          p_modalidad?: string
          p_offset?: number
          p_precio_max?: number
          p_precio_min?: number
          p_texto?: string
          p_tipo?: string
        }
        Returns: {
          activo: boolean
          autor_avatar: string
          autor_bio: string
          autor_email: string
          autor_id: string
          autor_nombre: string
          autor_ubicacion: string
          banner_url: string
          calificacion_promedio: number
          cantidad_inscriptos: number
          cantidad_reseñas: number
          categoria_icono: string
          categoria_id: number
          categoria_nombre: string
          categoria_slug: string
          clases_sinc: string
          created_at: string
          descripcion: string
          destacado: boolean
          dias_clases: string
          duracion_clase: string
          duracion_curso: string
          fecha_fin: string
          fecha_inicio: string
          finalizado: boolean
          horario: string
          id: string
          idioma: string
          inscripciones_cerradas: boolean
          materia: string
          max_alumnos: number
          modalidad: string
          modo: string
          moneda: string
          nivel: string
          otorga_certificado: boolean
          plataforma: string
          precio: number
          precio_tipo: string
          relevancia: number
          sinc: string
          tipo: string
          titulo: string
          ubicacion: string
          updated_at: string
          verificado: boolean
          vistas: number
        }[]
      }
      check_alertas_busqueda: { Args: never; Returns: number }
      confirmar_clase: {
        Args: { p_clase_id: string; p_usuario_email: string }
        Returns: Json
      }
      entregar_evaluacion: {
        Args: { p_eval_id: string; p_respuesta_json: string }
        Returns: {
          alumno_email: string
          corregido: boolean | null
          created_at: string | null
          evaluacion_id: string | null
          feedback: string | null
          id: string
          nota: number | null
          publicacion_id: string | null
          respuesta_json: string | null
          score_auto: number | null
        }
        SetofOptions: {
          from: "*"
          to: "evaluacion_entregas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_auto_confirmar_alumno: { Args: never; Returns: number }
      fn_liberar_pagos_vencidos: { Args: never; Returns: number }
      get_avg_time_faros: {
        Args: { p_puzzle_id: string }
        Returns: {
          avg_seconds: number
          player_count: number
        }[]
      }
      get_avg_time_shikaku: {
        Args: { p_date: string }
        Returns: {
          avg_seconds: number
          player_count: number
        }[]
      }
      get_docente_mp_connected: { Args: { p_email: string }; Returns: boolean }
      get_evaluaciones_pub: {
        Args: { p_pub_id: string }
        Returns: {
          activo: boolean | null
          contenido_json: string | null
          created_at: string | null
          formato: string | null
          generado_ia: boolean | null
          id: string
          publicacion_id: string | null
          skill_ids: string[] | null
          tipo: string | null
          titulo: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "evaluaciones"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_leaderboard_faros: {
        Args: { lim?: number }
        Returns: {
          best_time: number
          games_played: number
          is_me: boolean
          nombre: string
          pos: number
          total_score: number
        }[]
      }
      get_leaderboard_shikaku: {
        Args: { lim?: number }
        Returns: {
          best_time: number
          games_played: number
          is_me: boolean
          nombre: string
          pos: number
          total_score: number
        }[]
      }
      get_mensajes_grupo: {
        Args: { pub_id: string }
        Returns: {
          created_at: string | null
          de_nombre: string | null
          de_usuario: string | null
          editado: boolean | null
          editado_at: string | null
          id: string
          leido: boolean | null
          leido_at: string | null
          para_nombre: string | null
          para_usuario: string | null
          pub_titulo: string | null
          publicacion_id: string | null
          texto: string
        }[]
        SetofOptions: {
          from: "*"
          to: "mensajes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      incrementar_clicks_contacto: {
        Args: { p_publicacion_id: string }
        Returns: undefined
      }
      incrementar_saldo: {
        Args: { p_monto: number; p_usuario_id: string }
        Returns: undefined
      }
      incrementar_vistas: {
        Args: { p_publicacion_id: string }
        Returns: undefined
      }
      liberar_pago_clase: { Args: { p_clase_id: string }; Returns: Json }
      marcar_notifs_leidas:
        | { Args: never; Returns: undefined }
        | { Args: { p_email: string }; Returns: undefined }
      recalcular_inscriptos: { Args: { p_pub_id: string }; Returns: undefined }
      recalcular_rating_publicacion: {
        Args: { p_pub_id: string }
        Returns: undefined
      }
      sanitize_eval_content: { Args: { p_content: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
