import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'

export function useViajes() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const viajesQuery = useQuery({
    queryKey: ['viajes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('viajes')
        .select(`
          *,
          camiones!viajes_camion_id_fkey (
            placa,
            marca,
            modelo
          ),
          trailers!viajes_trailer_id_fkey (
            placa,
            tipo
          ),
          empleados!viajes_conductor_id_fkey (
            perfiles!empleados_user_id_fkey (
              nombre,
              apellido
            )
          ),
          cargas (
            cantidad,
            productos (
              nombre,
              codigo
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  return {
    viajes: viajesQuery.data || [],
    isLoading: viajesQuery.isLoading,
    error: viajesQuery.error,
  }
}