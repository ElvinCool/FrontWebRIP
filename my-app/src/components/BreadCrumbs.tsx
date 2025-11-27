import "./BreadCrumbs.css"
import React from "react"
import { Link, useSearchParams } from "react-router-dom"

interface ICrumb {
  label: string
  path?: string
}

interface BreadCrumbsProps {
  crumbs: ICrumb[]
}

const BreadCrumbs = ({ crumbs }: BreadCrumbsProps) => {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get("search")

  const getPathWithSearch = (path?: string) => {
    if (!path) return ""
    if (searchQuery) {
      const separator = path.includes("?") ? "&" : "?"
      return `${path}${separator}search=${encodeURIComponent(searchQuery)}`
    }
    return path
  }

  return (
    <ul className="breadcrumbs">
      {!!crumbs.length &&
        crumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <li className="slash">/</li>
            {index === crumbs.length - 1 ? (
              <li>{crumb.label}</li>
            ) : (
              <li>
                <Link to={getPathWithSearch(crumb.path)}>{crumb.label}</Link>
              </li>
            )}
          </React.Fragment>
        ))}
    </ul>
  )
}

export default BreadCrumbs