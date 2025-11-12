"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, RefreshCw, AlertCircle, Monitor } from "lucide-react"

interface ReportViewerProps {
  reportData: {
    reportId: string
    clientId: string
    uuid: string
    reportName: string
    clientName: string
    subdomain: string
  }
  onBack: () => void
}

export function ReportViewer({ reportData, onBack }: ReportViewerProps) {
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const reportUrl = `https://${reportData.subdomain}.report.intelligenceindustrielle.com/report/${reportData.uuid}`

  useEffect(() => {
    setIframeLoading(true)
    setIframeError(false)
  }, [reportData, refreshKey])

  const handleIframeLoad = () => {
    setIframeLoading(false)
    setIframeError(false)
  }

  const handleIframeError = () => {
    setIframeLoading(false)
    setIframeError(true)
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleOpenInNewTab = () => {
    window.open(reportUrl, "_blank")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{reportData.clientName}: {reportData.reportName}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          </div>

          {/* Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Informations du rapport
                </CardTitle>
                <Badge variant="secondary">En cours de visualisation</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-foreground">URL:</span>
                  <div className="text-muted-foreground font-mono break-all">{reportUrl}</div>
                </div>
                <div>
                  <span className="font-medium text-foreground">UUID:</span>
                  <div className="text-muted-foreground font-mono">{reportData.uuid}</div>
                </div>
                <div>
                  <span className="font-medium text-foreground">Base URL:</span>
                  <div className="text-muted-foreground">{reportData.subdomain}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Iframe Container */}
        <div className="relative">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative" style={{ height: "calc(100vh - 300px)", minHeight: "600px" }}>
                {iframeLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Chargement du rapport...</p>
                    </div>
                  </div>
                )}

                {iframeError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md">
                      <AlertCircle className="h-12 w-12 text-destructive" />
                      <div>
                        <h3 className="text-lg font-medium text-foreground mb-2">Erreur de chargement</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Impossible de charger le rapport. Vérifiez que l'URL est correcte et que le rapport est
                          accessible.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Réessayer
                          </Button>
                          <Button variant="outline" onClick={handleOpenInNewTab}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ouvrir directement
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <iframe
                  key={refreshKey}
                  src={reportUrl}
                  className="w-full h-full border-0"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  title={`Rapport ${reportData.reportName} - ${reportData.clientName}`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Ce rapport est affiché dans un iframe sécurisé. Si vous rencontrez des problèmes d'affichage, utilisez le
            bouton "Ouvrir dans un nouvel onglet" pour accéder directement au rapport.
          </p>
        </div>
      </div>
    </div>
  )
}

