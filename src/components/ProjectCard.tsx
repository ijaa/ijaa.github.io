import { ArrowRight } from 'lucide-react'
import { Project } from '../content/projects'

type ProjectCardProps = {
  project: Project
  onHover: () => void
}

export function ProjectCard({ project, onHover }: ProjectCardProps) {
  return (
    <a
      className="project-card"
      href={project.href}
      data-cursor="arrow"
      onMouseEnter={onHover}
      onFocus={onHover}
    >
      <div className="project-card-media">
        <img src={project.image} alt={`${project.title} 项目预览`} />
        <div className="project-card-edge">
          <span className="project-card-button">
            <ArrowRight aria-hidden="true" size={26} />
          </span>
        </div>
        <span className="project-card-notch project-card-notch-a" />
        <span className="project-card-notch project-card-notch-b" />
      </div>
      <div className="project-card-copy">
        <h3>{project.title}</h3>
        <p>{project.description}</p>
      </div>
    </a>
  )
}
