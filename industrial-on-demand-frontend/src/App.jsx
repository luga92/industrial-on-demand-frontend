import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const ROOT_ROUTE = '/'
const OPTIONS_ROUTE = '/options'
const LIST_ROUTE = '/requests'
const ACCOUNT_ROUTE = '/account'
const LOGIN_ROUTE = '/login'
const SIGNUP_ROUTE = '/signup'

const REQUEST_SKELETON_ITEMS = [1, 2, 3]

const CATEGORIES = [
  { name: 'Electricidad', icon: '⚡' },
  { name: 'Mecánica', icon: '🛠️' },
  { name: 'Electrónica', icon: '🔌' },
  { name: 'Fontanería', icon: '🚰' },
  { name: 'Carpintería', icon: '🪚' },
  { name: 'Refrigeración', icon: '❄️' },
  { name: 'Pintura', icon: '🎨' },
  { name: 'Soldadura', icon: '🔥' },
  { name: 'Hidráulica', icon: '💧' },
  { name: 'Neumática', icon: '🌬️' },
  { name: 'Instrumentista', icon: '📏' },
  { name: 'Fletes', icon: '🚚' },
  { name: 'Albañilería', icon: '🧱' },
]

const NAV_ITEMS = [
  { key: 'inicio', label: 'Inicio', icon: '🏠' },
  { key: 'opciones', label: 'Opciones', icon: '🧩' },
  { key: 'actividad', label: 'Actividad', icon: '🕒' },
  { key: 'cuenta', label: 'Cuenta', icon: '👤' },
]

const getStoredToken = () => {
  const storedToken =
    localStorage.getItem('token') ??
    localStorage.getItem('accessToken') ??
    localStorage.getItem('jwtToken')

  return storedToken ? storedToken.replace(/^"(.*)"$/, '$1') : ''
}

const getSectionFromPath = (path) => {
  if (path === LIST_ROUTE) return 'actividad'
  if (path === OPTIONS_ROUTE) return 'opciones'
  if (path === ACCOUNT_ROUTE) return 'cuenta'
  return 'inicio'
}

const getPathFromSection = (section) => {
  if (section === 'actividad') return LIST_ROUTE
  if (section === 'opciones') return OPTIONS_ROUTE
  if (section === 'cuenta') return ACCOUNT_ROUTE
  return ROOT_ROUTE
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
  const hasToken = Boolean(getStoredToken())
  const [activeSection, setActiveSection] = useState(() => getSectionFromPath(pathname))
  const [intent, setIntent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [description, setDescription] = useState('')
  const [requestStep, setRequestStep] = useState('idle')
  const [requests, setRequests] = useState([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [requestsMessage, setRequestsMessage] = useState('')

  useEffect(() => {
    if (!hasToken && pathname !== ROOT_ROUTE) {
      window.location.replace(ROOT_ROUTE)
    }
  }, [hasToken, pathname])

  useEffect(() => {
    if (!hasToken) {
      return
    }

    const nextPath = getPathFromSection(activeSection)
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, '', nextPath)
    }
  }, [activeSection, hasToken])

  useEffect(() => {
    if (!hasToken || activeSection !== 'actividad') {
      return
    }

    let isMounted = true

    const loadRequests = async () => {
      setIsLoadingRequests(true)
      setRequestsMessage('')

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
          throw new Error('Activity load failed')
        }

        const data = await response.json()
        const normalized = Array.isArray(data) ? data : []
        const sorted = [...normalized].sort((a, b) => {
          const aTime = new Date(a.createdAt).getTime()
          const bTime = new Date(b.createdAt).getTime()
          return bTime - aTime
        })

        if (isMounted) {
          setRequests(sorted)
        }
      } catch {
        if (isMounted) {
          setRequests([])
          setRequestsMessage(
            'Estamos teniendo un retraso al cargar tu actividad. Intenta de nuevo en un momento.'
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
  }, [activeSection, hasToken])

  const openCategoryFlow = (category) => {
    setSelectedCategory(category)
    setRequestStep('describe')
    if (!description && intent.trim()) {
      setDescription(intent.trim())
    }
  }

  const handleCreateRequest = async () => {
    const token = getStoredToken()
    const detail = description.trim()

    if (!token) {
      window.location.replace(ROOT_ROUTE)
      return
    }

    if (!selectedCategory || !detail) {
      return
    }

    setRequestStep('securing')
    const transitionStart = Date.now()

    try {
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedCategory,
          description: detail,
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

      setRequestStep('success')
      setDescription('')
      setIntent('')
    } catch {
      const elapsedMs = Date.now() - transitionStart
      if (elapsedMs < 1400) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 1400 - elapsedMs)
        })
      }

      setRequestStep('failure')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('jwtToken')
    window.location.replace(ROOT_ROUTE)
  }

  const activityItems = useMemo(() => requests, [requests])

  if (!hasToken) {
    return (
      <main className="app-page premium-root">
        <section className="hero">
          <h1>
            Soporte industrial confiable.
            <br />
            Cuando lo necesitas.
          </h1>

          <p className="hero-subtitle">
            Conectamos tu solicitud con técnicos verificados y especializados.
          </p>

          <div className="trust-indicators">
            <span>🔒 Solicitudes protegidas</span>
            <span>✅ Profesionales verificados</span>
          </div>

          <button className="cta-primary" onClick={() => window.location.assign(LOGIN_ROUTE)}>
            Crear solicitud
          </button>

          <p className="secondary-action">
            ¿Ya tienes cuenta? <a href={LOGIN_ROUTE}>Iniciar sesión</a>
          </p>
          <p className="secondary-action">
            ¿Primera vez? <a href={SIGNUP_ROUTE}>Crear cuenta</a>
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="ondemand-app">
      <section className="section-content">
        {activeSection === 'inicio' && (
          <section className="panel panel--inicio">
            <h1>¿Qué necesitas hoy?</h1>
            <input
              className="intent-input"
              placeholder="Describe el servicio que necesitas"
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
            />
            {intent.trim() && (
              <button
                type="button"
                className="nudge-button"
                onClick={() => setActiveSection('opciones')}
              >
                Continuar en Opciones
              </button>
            )}
          </section>
        )}

        {activeSection === 'opciones' && (
          <section className="panel panel--options">
            <h2>Opciones</h2>
            <p className="panel-subtitle">Elige una categoría para iniciar tu solicitud.</p>
            <div className="category-grid">
              {CATEGORIES.map((category) => (
                <button
                  type="button"
                  key={category.name}
                  className={`category-card ${selectedCategory === category.name ? 'is-selected' : ''}`}
                  onClick={() => openCategoryFlow(category.name)}
                >
                  <span className="category-icon" aria-hidden="true">
                    {category.icon}
                  </span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {requestStep !== 'idle' && (
              <section className="request-flow-card">
                {requestStep === 'describe' && (
                  <div className="flow-step">
                    <p className="flow-badge">{selectedCategory}</p>
                    <h3>Describe qué necesitas resolver</h3>
                    <textarea
                      rows={6}
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Cuéntanos el contexto para coordinar tu solicitud."
                    />
                    <button
                      type="button"
                      className="cta-primary cta-primary--compact"
                      onClick={handleCreateRequest}
                      disabled={!description.trim()}
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {requestStep === 'securing' && (
                  <div className="flow-step flow-step--status" role="status">
                    <div className="soft-loader" aria-hidden="true"></div>
                    <h3>Preparando tu solicitud…</h3>
                    <p>Estamos coordinando tu solicitud de forma segura.</p>
                  </div>
                )}

                {requestStep === 'success' && (
                  <div className="flow-step flow-step--status">
                    <h3>Solicitud en marcha</h3>
                    <p>Estamos coordinando tu solicitud.</p>
                    <button
                      type="button"
                      className="cta-primary cta-primary--compact"
                      onClick={() => {
                        setRequestStep('idle')
                        setSelectedCategory('')
                        setActiveSection('actividad')
                      }}
                    >
                      Ver actividad
                    </button>
                  </div>
                )}

                {requestStep === 'failure' && (
                  <div className="flow-step flow-step--status">
                    <h3>Tuvimos un retraso</h3>
                    <p>Vuelve a intentarlo en un momento.</p>
                    <button
                      type="button"
                      className="cta-primary cta-primary--compact"
                      onClick={() => setRequestStep('describe')}
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </section>
            )}
          </section>
        )}

        {activeSection === 'actividad' && (
          <section className="panel panel--activity">
            <h2>Actividad</h2>
            {isLoadingRequests && (
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
            )}

            {!isLoadingRequests && requestsMessage && (
              <p className="message message--error">{requestsMessage}</p>
            )}

            {!isLoadingRequests && !requestsMessage && activityItems.length === 0 && (
              <p className="empty-copy">Aún no tienes actividad. Tu próxima solicitud aparecerá aquí.</p>
            )}

            {!isLoadingRequests && !requestsMessage && activityItems.length > 0 && (
              <ul className="activity-list">
                {activityItems.map((request) => (
                  <li key={request.id} className="activity-item">
                    <div>
                      <strong>{request.type}</strong>
                      <p>{formatRequestDate(request.createdAt)}</p>
                    </div>
                    <span className="status-pill">{request.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeSection === 'cuenta' && (
          <section className="panel panel--account">
            <h2>Cuenta</h2>
            <div className="account-block">
              <h3>Info básica</h3>
              <p>Perfil activo</p>
            </div>
            <div className="account-block">
              <h3>Seguridad</h3>
              <p>Autenticación protegida con sesión vigente.</p>
            </div>
            <div className="account-block">
              <h3>Preferencias</h3>
              <p>Notificaciones y experiencia personalizable.</p>
            </div>
            <button type="button" className="logout-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </section>
        )}
      </section>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`bottom-nav__item ${activeSection === item.key ? 'is-active' : ''}`}
            onClick={() => setActiveSection(item.key)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  )
}

export default App
