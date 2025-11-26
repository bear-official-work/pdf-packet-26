import { supabase } from '@/lib/supabaseClient'
import crypto from 'crypto'

class AuthService {
  /**
   * Create a simple hash for password (client-side only, for demo purposes)
   */
  private hashPassword(password: string): string {
    return Buffer.from(password).toString('base64')
  }

  /**
   * Initialize admin user (creates one if doesn't exist)
   */
  async initializeAdminUser(email: string, password: string): Promise<void> {
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!existingUser) {
      const passwordHash = this.hashPassword(password)
      const { error } = await supabase
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHash,
        })

      if (error) {
        console.error('Error creating admin user:', error)
        throw error
      }
    }
  }

  /**
   * Authenticate admin user
   */
  async authenticateAdmin(email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error authenticating admin:', error)
      throw error
    }

    if (!data) {
      return false
    }

    const passwordHash = this.hashPassword(password)
    return data.password_hash === passwordHash
  }

  /**
   * Get admin session from localStorage
   */
  getAdminSession(): { email: string } | null {
    const session = localStorage.getItem('adminSession')
    if (!session) return null
    try {
      return JSON.parse(session)
    } catch {
      return null
    }
  }

  /**
   * Set admin session
   */
  setAdminSession(email: string): void {
    localStorage.setItem('adminSession', JSON.stringify({ email }))
  }

  /**
   * Clear admin session
   */
  clearAdminSession(): void {
    localStorage.removeItem('adminSession')
  }

  /**
   * Check if admin is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAdminSession() !== null
  }
}

export const authService = new AuthService()
