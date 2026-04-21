import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const ROOT_ROUTE = '/'
const LIST_ROUTE = '/requests'
const CREATE_ROUTE = '/requests/new'
const LOGIN_ROUTE = '/login'
const SIGNUP_ROUTE = '/signup'

const getStoredToken = () => {
  const storedToken =
    localStorage.getItem('token') ??
    localStorage.getItem('accessToken') ??
    localStorage.getItem('jwtToken')

  return storedToken ? storedToken.replace(/^"(.*)"$/, '$1') : ''
}

const formatRequestDate = (dateValue) => {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function App() {
  const pathname = window.location.pathname
  const isRootView = pathname === ROOT_ROUTE
  const isMyRequestsView = pathname === LIST_ROUTE
  const isCreateRequestView = pathname === CREATE_ROUTE
  const isProtectedView = isMyRequestsView || isCreateRequestView
  const hasToken = Boolean(getStoredToken())
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false)

  useEffect(() => {
    if (isRootView && hasToken) {
      window.location.replace(LIST_ROUTE)
    }
  }, [isRootView, hasToken])

  useEffect(() => {
    if (isProtectedView && !hasToken) {
      window.location.replace(ROOT_ROUTE)
    }
  }, [isProtectedView, hasToken])

  const [formData, setFormData] = useState({
    type: '',
    description: '',
    priority: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requests, setRequests] = useState([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [requestsError, setRequestsError] = useState('')

  useEffect(() => {
    if (!isMyRequestsView || !hasToken) {
      return
    }

    let isMounted = true

    const loadRequests = async () => {
      setIsLoadingRequests(true)
      setRequestsError('')

      try {
        const token = getStoredToken()

        if (!token) {
          window.location.replace(ROOT_ROUTE)
          return
        }

        const response = await fetch(`${API_BASE_URL}/requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Requests load failed')
        }

        const data = await response.json()

        if (isMounted) {
          setRequests(Array.isArray(data) ? data : [])
        }
      } catch {
        if (isMounted) {
          setRequests([])
          setRequestsError(
            'No se pudieron cargar las solicitudes en este momento. Inténtalo nuevamente.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingRequests(false)
        }
      }
    }

    loadRequests()

    return () => {
      isMounted = false
    }
  }, [isMyRequestsView, hasToken])

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

    const token = getStoredToken()

    const payload = {
      type: formData.type,
      description: formData.description,
    }

    if (formData.priority) {
      payload.priority = formData.priority
    }

    try {
      if (!token) {
        window.location.replace(ROOT_ROUTE)
        return
      }

      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  const handleRootPrimaryAction = () => {
    if (getStoredToken()) {
      window.location.assign(CREATE_ROUTE)
      return
    }

    setIsAuthGateOpen(true)
  }

  if (isRootView) {
    if (hasToken) {
      return <main className="app-page" />
    }

    return (
      <main className="root-landing">
        <section className="root-landing__content">
          <h1>
            Soporte industrial confiable.
            <br />
            Cuando lo necesitas.
          </h1>
          <p className="root-landing__subtitle">
            Conectamos tu solicitud con técnicos verificados y especializados.
          </p>
          <div className="trust-points">
            <div className="trust-item">
              <span className="trust-item__icon" aria-hidden="true">
                🔒
              </span>
              <span>Solicitudes protegidas</span>
            </div>
            <div className="trust-item">
              <span className="trust-item__icon" aria-hidden="true">
                ✓
              </span>
              <span>Profesionales verificados</span>
            </div>
          </div>
          <button
            type="button"
            className="root-cta"
            onClick={handleRootPrimaryAction}
          >
            Crear solicitud
          </button>
          <p className="root-login-link">
            ¿Ya tienes cuenta? <a href={LOGIN_ROUTE}>Iniciar sesión</a>
          </p>
        </section>

        {isAuthGateOpen && (
          <section className="gate-overlay" aria-label="Acceso seguro">
            <div
              className="gate-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-gate-title"
            >
              <h2 id="auth-gate-title">Protegemos tu solicitud</h2>
              <p>Para continuar, inicia sesión o crea una cuenta segura</p>
              <div className="gate-actions">
                <a className="gate-button gate-button--primary" href={LOGIN_ROUTE}>
                  Iniciar sesión
                </a>
                <a className="gate-button gate-button--secondary" href={SIGNUP_ROUTE}>
                  Crear cuenta
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    )
  }

  if (isProtectedView && !hasToken) {
    return <main className="app-page" />
  }

  return (
    <main className="app-page">
      <nav className="requests-nav" aria-label="Navegación de solicitudes">
        <a href={LIST_ROUTE}>Mis solicitudes</a>
        <a href={CREATE_ROUTE}>Crear nueva solicitud</a>
      </nav>

      {isMyRequestsView ? (
        <section className="requests-page">
          <h1>Mis solicitudes</h1>

          {isLoadingRequests && <p>Cargando solicitudes...</p>}

          {!isLoadingRequests && requestsError && (
            <p className="message message--error" role="alert">
              {requestsError}
            </p>
          )}

          {!isLoadingRequests && !requestsError && requests.length === 0 && (
            <div className="empty-state">
              <p>No tienes solicitudes registradas todavía.</p>
              <a className="cta-link" href={CREATE_ROUTE}>
                Crear nueva solicitud
              </a>
            </div>
          )}

          {!isLoadingRequests && !requestsError && requests.length > 0 && (
            <ul className="request-list">
              {requests.map((request) => (
                <li key={request.id}>
                  <a className="request-item" href={`/requests/${request.id}`}>
                    <span>
                      <strong>ID:</strong> {request.id}
                    </span>
                    <span>
                      <strong>Tipo:</strong> {request.type}
                    </span>
                    <span>
                      <strong>Estado:</strong> {request.status}
                    </span>
                    <span>
                      <strong>Fecha:</strong> {formatRequestDate(request.createdAt)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="new-request-page">
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
        </section>
      )}
    </main>
  )
}

export default App
