import { redirect } from 'next/navigation'

// Redirect public /submit to the author dashboard submit page
export default function SubmitRedirect() {
  redirect('/author/submit')
}