import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ImagingStudy } from '@/types/patient';

export async function POST(request: Request) {
  try {
    const { patientId, imaging } = await request.json();

    if (!patientId || !imaging) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the imaging object
    if (!imaging.type || !imaging.findings || !imaging.date) {
      return NextResponse.json({ error: 'Missing required imaging fields' }, { status: 400 });
    }

    // Create the imaging record in the database
    const { data, error } = await supabase
      .from('imaging')
      .insert([{
        patient_id: patientId,
        type: imaging.type,
        findings: imaging.findings,
        date: imaging.date,
        core: imaging.core || null,
        mismatch: imaging.mismatch || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving imaging:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Exception in imaging API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('imaging')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching imaging:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Exception in imaging API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, updates } = await request.json();

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the imaging record
    const { data, error } = await supabase
      .from('imaging')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating imaging:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error) {
    console.error('Exception in imaging API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 