// lib/hooks/use-camiones.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'

type Camion = Database['public']['Tables']['camiones']['Row']
type CamionInsert = Database['public']['Tables']['camiones']['Insert']
type CamionUpdate = Database['public']['Tables']['camiones']['Update']

export function useCamiones() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const camionesQuery = useQuery({
    queryKey: ['camiones'],
    queryFn: async () => {
      console.log('Fetching camiones...')
      
      const { data, error } = await supabase
        .from('camiones')
        .select(`
          *,
          perfiles:conductor_id (
            nombre,
            apellido
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching camiones:', error)
        throw error
      }

      return data
    },
  })

  const createCamion = useMutation({
    mutationFn: async (nuevoCamion: CamionInsert) => {
      console.log('Creando camión:', nuevoCamion)
      
      const { data, error } = await supabase
        .from('camiones')
        .insert([{
          ...nuevoCamion,
          fecha_registracion: nuevoCamion.fecha_registracion || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating camion:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] })
      toast.success('Camión creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el camión')
      console.error(error)
    },
  })

  const updateCamion = useMutation({
    mutationFn: async ({ id, ...update }: CamionUpdate & { id: string }) => {
      console.log('Actualizando camión:', id, update)
      
      const { data, error } = await supabase
        .from('camiones')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating camion:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] })
      toast.success('Camión actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el camión')
      console.error(error)
    },
  })

  const deleteCamion = useMutation({
    mutationFn: async (id: string) => {
      console.log('Eliminando camión:', id)
      
      const { error } = await supabase
        .from('camiones')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting camion:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camiones'] })
      toast.success('Camión eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el camión')
      console.error(error)
    },
  })

  return {
    camiones: camionesQuery.data || [],
    isLoading: camionesQuery.isLoading,
    error: camionesQuery.error,
    createCamion,
    updateCamion,
    deleteCamion,
  }
}