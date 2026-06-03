import { redirect } from 'next/navigation';

export default function ProjectIdentifyPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}/identify/step/1`);
}
