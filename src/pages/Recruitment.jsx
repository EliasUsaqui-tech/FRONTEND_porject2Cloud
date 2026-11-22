import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Action, Field, FileLink, Module, Pages, Panel, Resource, Rows } from "@/components/Module";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useResource } from "@/hooks/useResource";
import { CORE_WRITE_ROLES } from "@/lib/roles";
import { recruitment } from "@/services/hcmService";

const transitions = { APPLIED: ["INTERVIEW", "REJECTED"], INTERVIEW: ["OFFER", "REJECTED"], OFFER: ["HIRED", "REJECTED"] };
const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];

function useList(endpoint, filters) {
  const [tokens, setTokens] = useState([null]);
  const nextToken = tokens.at(-1);
  const page = tokens.length;
  const load = useCallback((signal) => endpoint({ ...filters, nextToken }, signal), [endpoint, filters, nextToken]);
  const state = useResource(load, JSON.stringify([filters, nextToken]));
  return { state, page, reset: () => setTokens([null]),
    change: (n, token) => setTokens(n < page ? tokens.slice(0, n) : [...tokens, token]) };
}

function Candidate({ data, reload }) {
  const { hasRole } = useAuth();
  const { candidate, documents } = data;
  const id = candidate.candidateId;
  const [url, setUrl] = useState(null);
  const available = documents.filter((document) => document.available);
  return <Panel title={candidate.fullName}>
    <p className="text-sm">{candidate.email} · {candidate.stage}</p>
    <Rows rows={candidate.stageHistory} id="at" columns={[["Etapa", "to"], ["Fecha", "at"], ["Nota", "note"]]} />
    <Rows rows={documents} id="docKey" columns={[["Documento", "name"], ["Estado", "status"]]} />
    {candidate.stage === "DRAFT" && <>
      {documents.map(({ docKey, name }) => <Action key={docKey} label={`Subir ${name}`} onSubmit={async ({ file }) => {
        await recruitment.upload(id, docKey, file);
        reload();
      }}><Field label={name} name="file" type="file" required accept={docKey === "resume" ? "application/pdf" : "application/pdf,image/jpeg,image/png"} /></Action>)}
      <Action label="Enviar candidatura" onSubmit={async () => { await recruitment.submit(id); reload(); }} />
    </>}
    {available.length > 0 && <Action label="Obtener enlace del documento" onSubmit={async ({ key }) => setUrl((await recruitment.document(id, key)).url)}>
      <Field label="Documento" name="key" options={available.map(({ docKey, name }) => ({ value: docKey, label: name }))} />
    </Action>}
    <FileLink url={url}>Abrir documento</FileLink>
    {transitions[candidate.stage] && <Action label="Cambiar etapa" onSubmit={async (values) => {
      await recruitment.stage(id, values);
      reload();
    }}>
      <Field label="Etapa" name="stage" options={transitions[candidate.stage]} />
      <Field label="Nota" name="note" />
    </Action>}
    {candidate.stage === "HIRED" && <p className="text-sm">
      Core HR recibe la contratación de forma asíncrona.{" "}
      {hasRole(...CORE_WRITE_ROLES) && <Link className="text-primary underline" to="/employees?status=PENDING_ONBOARDING">Ver onboarding pendiente</Link>}
    </p>}
  </Panel>;
}

export default function Recruitment() {
  const [vacancy, setVacancy] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const [status, setStatus] = useState("");
  const vacancyFilters = useMemo(() => ({ status: status || undefined }), [status]);
  const vacancyId = vacancy?.vacancyId;
  const candidateFilters = useMemo(() => ({ includeDrafts: true, vacancyId }), [vacancyId]);
  const vacancies = useList(recruitment.vacancies, vacancyFilters);
  const candidates = useList(recruitment.candidates, candidateFilters);
  const detail = useResource(useCallback((signal) => recruitment.candidate(candidateId, signal), [candidateId]), candidateId);
  function select(row) {
    setVacancy(row);
    setCandidateId(null);
    candidates.reset();
  }

  return <Module title="Reclutamiento">
    <Panel title="Vacantes">
      <Field label="Estado" options={[{ value: "", label: "Todas" }, "OPEN", "CLOSED"]} value={status}
        onChange={(event) => { setStatus(event.target.value); vacancies.reset(); }} />
      <Resource state={vacancies.state}>{(data) => <>
        <Rows rows={data.items} id="vacancyId" columns={[
          ["Vacante", (row) => <Button variant="link" onClick={() => select(row)}>{row.title}</Button>],
          ["Departamento", "department"], ["Estado", "status"],
        ]} />
        <Pages data={data} page={vacancies.page} change={vacancies.change} />
      </>}</Resource>
    </Panel>
    <Panel title="Crear vacante">
      <Action label="Crear" onSubmit={async ({ requireLinkedin, certificates, ...values }) => {
        await recruitment.createVacancy({
          ...values, requireLinkedin: requireLinkedin === "on",
          requiredCertificates: certificates.split(",").map((name) => name.trim()).filter(Boolean).map((name) => ({ name, mandatory: true })),
        });
        vacancies.reset();
        vacancies.state.reload();
      }}>
        <Field label="Título" name="title" required />
        <Field label="Departamento" name="department" required />
        <Field label="Descripción" name="description" />
        <Field label="Ubicación" name="location" />
        <Field label="Tipo" name="employmentType" options={employmentTypes} />
        <Field label="Certificados obligatorios (separados por coma)" name="certificates" />
        <label className="flex items-center gap-2 text-sm"><input name="requireLinkedin" type="checkbox" /> Solicitar LinkedIn</label>
      </Action>
    </Panel>
    {vacancy && <Panel title={vacancy.title}>
      <Action key={vacancy.vacancyId} label="Guardar vacante" onSubmit={async (values) => {
        await recruitment.editVacancy(vacancy.vacancyId, values);
        setVacancy({ ...vacancy, ...values });
        vacancies.state.reload();
      }}>
        <Field label="Título" name="title" defaultValue={vacancy.title} required />
        <Field label="Departamento" name="department" defaultValue={vacancy.department} required />
        <Field label="Estado" name="status" options={["OPEN", "CLOSED"]} defaultValue={vacancy.status} />
      </Action>
      {vacancy.status === "OPEN" && <Action key={`candidate-${vacancy.vacancyId}`} label="Crear candidatura" onSubmit={async ({ linkedin, ...values }) => {
        const data = await recruitment.createCandidate({ ...values, vacancyId: vacancy.vacancyId, ...(linkedin && { linkedin: { url: linkedin } }) });
        setCandidateId(data.candidate?.candidateId || data.candidateId);
        candidates.reset();
        candidates.state.reload();
      }}>
        <Field label="Nombre completo" name="fullName" required />
        <Field label="Correo" name="email" type="email" required />
        <Field label="Teléfono" name="phone" />
        <Field label="LinkedIn" name="linkedin" type="url" required={vacancy.requireLinkedin} />
      </Action>}
    </Panel>}
    <Panel title={vacancy ? `Candidatos de ${vacancy.title}` : "Candidatos"}>
      {vacancy && <Button variant="outline" onClick={() => select(null)}>Ver todas las candidaturas</Button>}
      <Resource state={candidates.state}>{(data) => <>
        <Rows rows={data.items} id="candidateId" columns={[
          ["Nombre", (row) => <Button variant="link" onClick={() => setCandidateId(row.candidateId)}>{row.fullName}</Button>],
          ["Vacante", "vacancyTitle"], ["Etapa", "stage"],
        ]} />
        <Pages data={data} page={candidates.page} change={candidates.change} />
      </>}</Resource>
    </Panel>
    <Resource state={detail}>{(data) => <Candidate key={candidateId} data={data} reload={() => {
      detail.reload();
      candidates.state.reload();
      vacancies.state.reload();
    }} />}</Resource>
  </Module>;
}
