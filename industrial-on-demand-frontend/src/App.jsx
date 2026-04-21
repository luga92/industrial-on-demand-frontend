import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const ROOT_ROUTE = '/'
const LIST_ROUTE = '/requests'
const CREATE_ROUTE = '/requests/new'
const LOGIN_ROUTE = '/login'
const SIGNUP_ROUTE = '/signup'
const REQUEST_SKELETON_ITEMS = [1, 2, 3]

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
  const [isRootActionActive, setIsRootActionActive] = useState(false)
  const [requestDescription, setRequestDescription] = useState('')
  const [createFlowStep, setCreateFlowStep] = useState('compose')

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
            'Tuvimos un inconveniente al organizar tus solicitudes. Inténtalo nuevamente en un momento.'
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

  const handleCreateRequest = async () => {
    const token = getStoredToken()

    if (!token) {
      window.location.replace(ROOT_ROUTE)
      return
    }

    const description = requestDescription.trim()

    if (!description) {
      return
    }

    setCreateFlowStep('securing')
    const transitionStart = Date.now()

    try {
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'general',
          description,
        }),
      })

      if (!response.ok) {
        throw new Error('Request creation failed')
      }

      await response.json()

      const elapsedMs = Date.now() - transitionStart
      if (elapsedMs < 1400) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 1400 - elapsedMs)
        })
      }

      setCreateFlowStep('success')
      setRequestDescription('')
    } catch {
      const elapsedMs = Date.now() - transitionStart
      if (elapsedMs < 1400) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 1400 - elapsedMs)
        })
      }
      setCreateFlowStep('failure')
    }
  }

  const handleRootPrimaryAction = () => {
    setIsRootActionActive(true)

    if (getStoredToken()) {
      window.location.assign(CREATE_ROUTE)
      return
    }

    setIsAuthGateOpen(true)
  }

  useEffect(() => {
    if (isAuthGateOpen) {
      setIsRootActionActive(false)
    }
  }, [isAuthGateOpen])

  if (isRootView) {
    if (hasToken) {
      return <main className="app-page" />
    }

    return (
      <main className="root-landing view-shell">
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
            className={`root-cta cta-animated ${isRootActionActive ? 'is-active' : ''}`}
            onClick={handleRootPrimaryAction}
          >
            {isRootActionActive ? 'Preparando…' : 'Crear solicitud'}
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
    return <main className="app-page view-shell" />
  }

  return (
    <main className="app-page view-shell">
      <nav className="requests-nav" aria-label="Navegación de solicitudes">
        <a href={LIST_ROUTE}>Mis solicitudes</a>
        <a href={CREATE_ROUTE}>Crear nueva solicitud</a>
      </nav>

      {isMyRequestsView ? (
        <section className="requests-page">
          <h1>Mis solicitudes</h1>

          {isLoadingRequests && (
            <div className="requests-loading" role="status">
              <p className="narrative-feedback">Organizando tu información…</p>
              <ul className="skeleton-list" aria-hidden="true">
                {REQUEST_SKELETON_ITEMS.map((item) => (
                  <li key={item} className="skeleton-item">
                    <span className="skeleton-line skeleton-line--short"></span>
                    <span className="skeleton-line"></span>
                    <span className="skeleton-line"></span>
                    <span className="skeleton-line skeleton-line--medium"></span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
        <section className="create-flow-page">
          {createFlowStep === 'compose' && (
            <div className="create-step create-step--compose step-transition">
              <h1>¿Qué necesitas resolver hoy?</h1>
              <textarea
                value={requestDescription}
                onChange={(event) => setRequestDescription(event.target.value)}
                rows={8}
                placeholder="Ejemplo: La línea de producción se detuvo y necesitamos revisión técnica en planta."
              />
              <button
                type="button"
                className="cta-animated"
                onClick={handleCreateRequest}
                disabled={!requestDescription.trim()}
              >
                Continuar
              </button>
            </div>
          )}

          {createFlowStep === 'securing' && (
            <div className="create-step create-step--securing step-transition" role="status">
              <div className="soft-loader" aria-hidden="true"></div>
              <h1>Estamos preparando tu solicitud de forma segura…</h1>
              <p>Protegiendo y organizando tu información</p>
            </div>
          )}

          {createFlowStep === 'success' && (
            <div className="create-step create-step--success step-transition">
              <h1>✅ Solicitud creada</h1>
              <p>Nuestro sistema ya está coordinando tu solicitud.</p>
              <a className="create-step-link" href={LIST_ROUTE}>
                Ver mis solicitudes
              </a>
            </div>
          )}

          {createFlowStep === 'failure' && (
            <div className="create-step create-step--failure step-transition">
              <h1>Tuvimos un problema.</h1>
              <p>Inténtalo de nuevo en un momento.</p>
              <button
                type="button"
                className="cta-animated"
                onClick={() => setCreateFlowStep('compose')}
              >
                Intentar nuevamente
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default App
