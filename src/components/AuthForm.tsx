"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { FormField } from "@/components/FormField"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/client"
import { signUp, signIn } from "@/lib/actions/auth.action"

const authFormSchema = ( type: FormType ) =>  
  z.object({
  name: type==='sign-up' ? z.string().min(2) : z.string().optional(),
  email: z.string().email(),
  password: z.string().min(3)
})

const AuthForm = ({ type }: { type: FormType }) => {

  const router = useRouter();

  const formSchema = authFormSchema(type);
    // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })
 
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if(type === "sign-up"){
        const { name, email, password } = values;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const result = await signUp({
          uid: userCredential.user.uid,
          name: name ?? "",
          email,
          password,
        })
        if(!result?.success) {
          toast.error(result?.message);
          return;
        }
        toast.success('Account create successfully! Please sign in.');
        router.push('/sign-in');
      } else {
        const { email, password } = values;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        if(!idToken) {
          toast.error('Sign In Failed! Please try again.');
          return;
        }
        await signIn({
          email,
          idToken,
        });
        toast.success('Signed In successfully!');
        router.push('/');
      }
    } catch (error) {
      console.error(error);
      toast.error(`There is error: ${error}`)
    }
  }

  const isSignIn = type === "sign-in";

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center px-4 pattern relative overflow-hidden">
      <div className="max-w-sm w-full relative z-10">
        {/* Form */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl shadow-lg p-8 space-y-6">
          {/* Header inside form */}
          <div className="text-center pb-4 border-b border-border/20">
            <h2 className="text-2xl font-semibold text-foreground">
              {isSignIn ? "Welcome back" : "Start practicing"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {isSignIn ? "Continue your AI interview preparation" : "Join thousands mastering interviews with AI"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {!isSignIn && (
                <FormField
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder="Your name"
                  required={true}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="your@email.com"
                required={true}
              />

              <FormField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                placeholder="Password"
                required={true}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-primary hover:bg-primary/90 transition-colors"
                >
                  {isSignIn ? "Sign in" : "Create account"}
                </Button>
              </div>
            </form>
          </Form>

          {/* Footer inside form */}
          <div className="text-center pt-4 border-t border-border/20">
            <p className="text-sm text-muted-foreground">
              {isSignIn ? "Don't have an account? " : "Already have an account? "}
              <Link
                href={isSignIn ? "/sign-up" : "/sign-in"}
                className="text-primary hover:underline font-medium"
              >
                {isSignIn ? "Sign up" : "Sign in"}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthForm