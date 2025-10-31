import { Breadcrumb } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  path?: string
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <Breadcrumb>
      <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>Главная</Breadcrumb.Item>
      {crumbs.map((c, idx) => (
        <Breadcrumb.Item
          key={idx}
          active={idx === crumbs.length - 1 || !c.path}
          linkAs={c.path ? (Link as any) : undefined}
          linkProps={c.path ? { to: c.path } : undefined}
        >
          {c.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  )
}

export default Breadcrumbs


