import "./BreadCrumbs.css"
import React from "react"
import { Link } from "react-router-dom"

interface ICrumb {
  label: string
  path?: string
}

interface BreadCrumbsProps {
  crumbs: ICrumb[]
}

const BreadCrumbs = ({ crumbs }: BreadCrumbsProps) => {
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
                <Link to={crumb.path || ""}>{crumb.label}</Link>
              </li>
            )}
          </React.Fragment>
        ))}
    </ul>
  )
}

export default BreadCrumbs