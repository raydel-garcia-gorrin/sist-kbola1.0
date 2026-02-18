// lib/hooks/use-trailers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'

type Trailer = Database['public']['Tables']['trailers']['Row']
type TrailerInsert = Database['public']['Tables']['trailers']['Insert']
type TrailerUpdate = Database['public']['Tables']['trailers']['Update']

export function useTrailers() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const trailersQuery = useQuery({
    queryKey: ['trailers'],
    queryFn: async () => {
      console.log('Fetching trailers...')
      
      const { data, error } = await supabase
        .from('trailers')
        .select(`
          *,
          camiones!trailers_camion_actual_id_fkey (
            id,
            placa,
            marca,
            modelo
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching trailers:', error)
        throw error
      }

      return data
    },
  })

  const createTrailer = useMutation({
    mutationFn: async (nuevoTrailer: TrailerInsert) => {
      console.log('Creando trailer:', nuevoTrailer)
      
      const { data, error } = await supabase
        .from('trailers')
        .insert([{
          ...nuevoTrailer,
          fecha_registracion: nuevoTrailer.fecha_registracion || new Date().toISOString().split('T')[0]
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating trailer:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] })
      toast.success('Trailer creado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear el trailer')
      console.error(error)
    },
  })

  const updateTrailer = useMutation({
    mutationFn: async ({ id, ...update }: TrailerUpdate & { id: string }) => {
      console.log('Actualizando trailer:', id, update)
      
      const { data, error } = await supabase
        .from('trailers')
        .update(update)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating trailer:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] })
      toast.success('Trailer actualizado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar el trailer')
      console.error(error)
    },
  })

  const deleteTrailer = useMutation({
    mutationFn: async (id: string) => {
      console.log('Eliminando trailer:', id)
      
      const { error } = await supabase
        .from('trailers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting trailer:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailers'] })
      toast.success('Trailer eliminado exitosamente')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el trailer')
      console.error(error)
    },
  })

  return {
    trailers: trailersQuery.data || [],
    isLoading: trailersQuery.isLoading,
    error: trailersQuery.error,
    createTrailer,
    updateTrailer,
    deleteTrailer,
  }
}