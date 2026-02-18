// lib/hooks/use-supabase-query.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { PostgrestError } from '@supabase/supabase-js'

type QueryOptions<T> = Omit<UseQueryOptions<T, PostgrestError>, 'queryKey' | 'queryFn'>

export function useSupabaseQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options?: QueryOptions<T>
) {
  return useQuery<T, PostgrestError>({
    queryKey: key,
    queryFn,
    ...options,
  })
}

// Ejemplo de uso:
// export function useCamiones() {
//   const supabase = createClient()
//   return useSupabaseQuery(
//     ['camiones'],
//     async () => {
//       const { data, error } = await supabase.from('camiones').select('*')
//       if (error) throw error
//       return data
//     }
//   )
// }