import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Database } from '@/types/supabase'

export function useProductos() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const productosQuery = useQuery({
    queryKey: ['productos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  const createProducto = useMutation({
    mutationFn: async (newProducto: Database['public']['Tables']['productos']['Insert']) => {
      const { data, error } = await supabase
        .from('productos')
        .insert([newProducto])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto creado exitosamente')
    },
    onError: (error) => {
      toast.error('Error al crear el producto')
      console.error(error)
    },
  })

  return {
    productos: productosQuery.data || [],
    isLoading: productosQuery.isLoading,
    error: productosQuery.error,
    createProducto,
  }
}