import { ClinicianGate } from "@/components/clinician-gate"

export default function VirtualPatientLayout({ children }: { children: React.ReactNode }) {
  return <ClinicianGate feature="Virtual Patient">{children}</ClinicianGate>
}
