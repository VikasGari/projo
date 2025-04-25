import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { BsPlusLg } from 'react-icons/bs';
import TaskCard from './TaskCard';

const TaskColumn = ({ title, tasks = [], status, onTaskClick, onTaskAction, isAdmin }) => {
  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          className={`task-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className="column-header">
            <h3>
              {title}
              <span className="task-count">{tasks.length}</span>
            </h3>
            {status === 'todo' && isAdmin && (
              <button 
                className="add-task-btn"
                onClick={() => onTaskAction('add')}
                title="Add new task"
              >
                <BsPlusLg />
              </button>
            )}
          </div>

          <div className="tasks-container">
            {tasks.map((task, index) => (
              <Draggable
                key={task._id}
                draggableId={task._id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onTaskClick(task)}
                      onAction={onTaskAction}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default TaskColumn; 