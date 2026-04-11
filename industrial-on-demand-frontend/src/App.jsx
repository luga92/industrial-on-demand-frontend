import { useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function App() {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    priority: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previousValue) => ({
      ...previousValue,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    const token =
      localStorage.getItem('token') ??
      localStorage.getItem('accessToken') ??
      localStorage.getItem('jwtToken')

    const payload = {
      type: formData.type,
      description: formData.description,
    }

    if (formData.priority) {
      payload.priority = formData.priority
    }

    try {
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Request creation failed')
      }

      const data = await response.json()
      setSuccessMessage('Solicitud creada correctamente. Redirigiendo...')
      window.setTimeout(() => {
        window.location.assign(`/requests/${data.id}`)
      }, 800)
    } catch {
      setErrorMessage(
        'No se pudo crear la solicitud en este momento. Inténtalo nuevamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="new-request-page">
      <h1>Crear nueva solicitud</h1>
      <form className="request-form" onSubmit={handleSubmit}>
        <label htmlFor="type">Tipo</label>
        <input
          id="type"
          name="type"
          type="text"
          value={formData.type}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />

        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={5}
          required
          disabled={isSubmitting}
        />

        <label htmlFor="priority">Prioridad (opcional)</label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="">Seleccionar</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando solicitud...' : 'Crear solicitud'}
        </button>
      </form>

      {successMessage && (
        <p className="message message--success" role="status">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="message message--error" role="alert">
          {errorMessage}
        </p>
      )}
    </main>
  )
}

export default App
