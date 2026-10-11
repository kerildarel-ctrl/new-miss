import { NextResponse } from 'next/server';
import { ADMIN_SECRET } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || password !== ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe administrateur incorrect' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Authentification administrateur /keril réussie',
      agent: {
        id: 'admin-keril',
        name: 'Admin /keril',
        role: 'ADMIN',
      },
    });

    // Set HTTP Cookie for server authorization
    response.cookies.set({
      name: 'keril_admin_auth',
      value: 'true',
      path: '/',
      httpOnly: false, // Accessible to script
      maxAge: 86400 * 7, // 7 days
      sameSite: 'lax',
    });

    response.cookies.set({
      name: 'keril_admin_key',
      value: ADMIN_SECRET,
      path: '/',
      httpOnly: false,
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur d’authentification' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Déconnexion effectuée' });
  response.cookies.delete('keril_admin_auth');
  response.cookies.delete('keril_admin_key');
  return response;
}
