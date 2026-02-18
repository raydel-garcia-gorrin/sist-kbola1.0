// lib/hooks/use-empleados.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'

type Empleado = Database['public']['Tables']['empleados']['Row']
type EmpleadoInsert = Database['public']['Tables']['empleados']['Insert']
type EmpleadoUpdate = Database['public']['Tables']['empleados']['Update']

export function useEmpleados() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Obtener todos los empleados - VERSIÓN SIMPLIFICADA
  const empleadosQuery = useQuery({
    queryKey: ['empleados'],
    queryFn: async () => {
      console.log('Fetching empleados...')
      
      // Primero obtener los empleados
      const { data: empleados, error: empError } = await supabase
        .from('empleados')
        .select('*')
        .order('created_at', { ascending: false })

      if (empError) {
        console.error('Error fetching empleados:', empError)
        throw empError
      }

      console.log('Empleados obtenidos:', empleados)

      // Si no hay empleados, retornar array vacío
      if (!empleados || empleados.length === 0) {
        return []
      }

      // Obtener los perfiles para cada empleado
      const empleadosConPerfiles = await Promise.all(
        empleados.map(async (empleado) => {
          if (!empleado.user_id) {
            return {
              ...empleado,
              perfiles: null
            }
          }

          const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('nombre, apellido, telefono')
            .eq('id', empleado.user_id)
            .single()

          if (perfilError) {
            console.error('Error fetching perfil for user:', empleado.user_id, perfilError)
            return {
              ...empleado,
              perfiles: null
            }
          }

          return {
            ...empleado,
            perfiles: perfil
          }
        })
      )

      console.log('Empleados con perfiles:', empleadosConPerfiles)
      return empleadosConPerfiles
    },
  })

  // Obtener un empleado por ID
  const getEmpleado = (id: string) => {
    return useQuery({
      queryKey: ['empleados', id],
      queryFn: async () => {
        const { data: empleado, error: empError } = await supabase
          .from('empleados')
          .select('*')
          .eq('id', id)
          .single()

        if (empError) throw empError

        if (empleado?.user_id) {
          const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('nombre, apellido, telefono')
            .eq('id', empleado.user_id)
            .single()

          if (!perfilError) {
            return {
              ...empleado,
              perfiles: perfil
            }
          }
        }

        return {
          ...empleado,
          perfiles: null
        }
      },
      enabled: !!id,
    })
  }

  // Crear un nuevo empleado
  const createEmpleado = useMutation({
    mutationFn: async (nuevoEmpleado: {
      email: string
      password: string
      nombre: string
      apellido: string
      telefono: string
      tipo_empleado: 'conductor' | 'mecanico' | 'administrativo' | 'cargador'
      fecha_contratacion: string
      salario: number
      licencia_conducir?: string
    }) => {
      console.log('Creando empleado con datos:', nuevoEmpleado)

      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nuevoEmpleado.email.trim().toLowerCase(),
        password: nuevoEmpleado.password,
        options: {
          data: {
            nombre: nuevoEmpleado.nombre,
            apellido: nuevoEmpleado.apellido,
            telefono: nuevoEmpleado.telefono,
          },
        },
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario')
      }

      console.log('Usuario auth creado:', authData.user.id)

      // 2. Crear perfil
      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert([{
          id: authData.user.id,
          nombre: nuevoEmpleado.nombre,
          apellido: nuevoEmpleado.apellido,
          telefono: nuevoEmpleado.telefono,
          rol: nuevoEmpleado.tipo_empleado === 'conductor' ? 'conductor' : 'asistente',
        }])

      if (perfilError) {
        console.error('Error creating profile:', perfilError)
        throw new Error(`Error al crear perfil: ${perfilError.message}`)
      }

      console.log('Perfil creado')

      // 3. Crear empleado
      const { data, error } = await supabase
        .from('empleados')
        .insert([{
          user_id: authData.user.id,
          tipo_empleado: nuevoEmpleado.tipo_empleado,
          fecha_contratacion: nuevoEmpleado.fecha_contratacion,
          salario: nuevoEmpleado.salario,
          licencia_conducir: nuevoEmpleado.licencia_conducir || null,
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating empleado:', error)
        throw new Error(`Error al crear empleado: ${error.message}`)
      }

      console.log('Empleado creado:', data)
      return {
        ...data,
        perfiles: {
          nombre: nuevoEmpleado.nombre,
          apellido: nuevoEmpleado.apellido,
          telefono: nuevoEmpleado.telefono,
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      toast.success('Empleado creado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error en createEmpleado:', error)
      toast.error(error.message || 'Error al crear el empleado')
    },
  })

  // Actualizar empleado
  const updateEmpleado = useMutation({
    mutationFn: async ({ id, ...update }: EmpleadoUpdate & { id: string }) => {
      console.log('Actualizando empleado:', id, update)
      
      const { data, error } = await supabase
        .from('empleados')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating empleado:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      toast.success('Empleado actualizado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error en updateEmpleado:', error)
      toast.error(error.message || 'Error al actualizar el empleado')
    },
  })

  // Eliminar empleado
  const deleteEmpleado = useMutation({
    mutationFn: async (id: string) => {
      console.log('Eliminando empleado:', id)
      
      const { error } = await supabase
        .from('empleados')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting empleado:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados'] })
      toast.success('Empleado eliminado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error en deleteEmpleado:', error)
      toast.error(error.message || 'Error al eliminar el empleado')
    },
  })

  return {
    empleados: empleadosQuery.data || [],
    isLoading: empleadosQuery.isLoading,
    error: empleadosQuery.error,
    getEmpleado,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
  }
}