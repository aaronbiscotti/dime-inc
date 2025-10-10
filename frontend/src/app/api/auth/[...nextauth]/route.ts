import NextAuth, { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as Adapter,

  providers: [
    {
      id: "instagram",
      name: "Instagram",
      type: "oauth",
      version: "2.0",

      authorization: {
        url: "https://api.instagram.com/oauth/authorize",
        params: {
          scope: "instagram_business_basic,instagram_business_manage_messages,instagram_business_content_publish,instagram_business_manage_insights,instagram_business_manage_comments",
        },
      },

      token: "https://api.instagram.com/oauth/access_token",

      userinfo: {
        url: "https://graph.instagram.com/me",
        params: {
          fields: "id,username,account_type",
        },
        async request({ tokens, provider }) {
          const response = await fetch(
            `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokens.access_token}`
          );
          return await response.json();
        },
      },

      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: null, // Instagram API with Instagram Login doesn't provide email
          image: null,
        };
      },

      clientId: process.env.INSTAGRAM_APP_ID!,
      clientSecret: process.env.INSTAGRAM_APP_SECRET!,
    },
  ],

  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.accessToken = token.accessToken as string;
        session.instagramUserId = token.instagramUserId as string;
      }
      return session;
    },

    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.instagramUserId = profile?.id;
      }
      return token;
    },
  },

  pages: {
    signIn: "/login/ambassador",
    error: "/login/ambassador",
  },

  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
