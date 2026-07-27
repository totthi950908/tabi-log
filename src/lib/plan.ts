import { supabase } from '@/lib/supabase'
import type { Booking, PlanItem } from '@/types'

// ---------- 予約（bookings） ----------

export async function listBookings(tripId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('trip_id', tripId)
    .order('start_at', { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as Booking[]
}

export type BookingInput = Omit<
  Booking,
  'id' | 'trip_id' | 'created_by' | 'created_at'
>

export async function createBooking(
  tripId: string,
  createdBy: string,
  input: BookingInput,
): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .insert({ ...input, trip_id: tripId, created_by: createdBy })
  if (error) throw error
}

export async function updateBooking(
  id: string,
  input: BookingInput,
): Promise<void> {
  const { error } = await supabase.from('bookings').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

// ---------- 日程（plan_items） ----------

export async function listPlanItems(tripId: string): Promise<PlanItem[]> {
  const { data, error } = await supabase
    .from('plan_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as PlanItem[]
}

export type PlanItemInput = Omit<
  PlanItem,
  'id' | 'trip_id' | 'created_by' | 'created_at'
>

export async function createPlanItem(
  tripId: string,
  createdBy: string,
  input: PlanItemInput,
): Promise<void> {
  const { error } = await supabase
    .from('plan_items')
    .insert({ ...input, trip_id: tripId, created_by: createdBy })
  if (error) throw error
}

export async function updatePlanItem(
  id: string,
  input: PlanItemInput,
): Promise<void> {
  const { error } = await supabase.from('plan_items').update(input).eq('id', id)
  if (error) throw error
}

export async function deletePlanItem(id: string): Promise<void> {
  const { error } = await supabase.from('plan_items').delete().eq('id', id)
  if (error) throw error
}
