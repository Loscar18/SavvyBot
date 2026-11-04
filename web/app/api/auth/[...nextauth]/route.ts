import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "../../../../lib/db";
import { users, sessions } from "../../../../lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword } from "../../../../lib/crypto";
import { createToken, verifyToken } from "../../../../lib/auth";
import { generateToken } from "../../../../lib/crypto";

// NextAuth configuration
const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos");
        }

        // Find user by email
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            passwordHash: users.passwordHash,
            workspaceId: users.workspaceId,
            role: users.role,
            avatar: users.avatar,
            emailVerified: users.emailVerified,
          })
          .from(users)
          .where(eq(users.email, credentials.email.toLowerCase()))
          .limit(1);

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        // Check password
        const isValidPassword = await comparePassword(
          credentials.password,
          user.passwordHash || ""
        );

        if (!isValidPassword) {
          throw new Error("Contraseña incorrecta");
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Por favor verifica tu email");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          role: user.role,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
        };
      },
    }),

    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  // Custom pages
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
  },

  // Callbacks
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        // Save user if it's a new Google user
        if (account.provider === "google") {
          const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.googleId, profile?.sub || ""))
            .limit(1);

          if (!existingUser) {
            // Create new workspace
            const workspaceSlug = generateToken(8);
            
            await db.insert(users).values({
              id: token.sub || "",
              email: profile?.email || "",
              name: profile?.name || "Usuario",
              googleId: profile?.sub || "",
              workspaceId: workspaceSlug,
              role: "owner",
              emailVerified: true,
              avatar: profile?.picture || undefined,
            });

            // Create workspace
            await db.insert(workspaces).values({
              id: workspaceSlug,
              name: `${profile?.name || "Usuario"}'s Workspace`,
              slug: workspaceSlug,
              plan: "free",
              timezone: "Europe/Madrid",
              theme: "light",
              language: "es",
              billingEnabled: false,
            });
          }
        }

        // Create JWT tokens
        const accessToken = await createToken(
          user.id,
          (user as any).workspaceId || "",
          "access"
        );
        const refreshToken = await createToken(
          user.id,
          (user as any).workspaceId || "",
          "refresh"
        );

        // Store session in database
        await db.insert(sessions).values({
          userId: user.id,
          token: accessToken,
          refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        token.accessToken = accessToken;
        token.refreshToken = refreshToken;
        token.workspaceId = (user as any).workspaceId;
        token.role = (user as any).role;
      }

      return token;
    },

    async session({ session, token }) {
      // Add user data to session
      session.user.id = token.sub || "";
      session.user.workspaceId = token.workspaceId || "";
      session.user.role = token.role || "member";
      session.accessToken = token.accessToken || "";
      session.refreshToken = token.refreshToken || "";

      return session;
    },
  },

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Secret
  secret: process.env.JWT_SECRET,
};

// Import workspaces from schema
import { workspaces } from "../../../../lib/db/schema";

// Create NextAuth handler
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
