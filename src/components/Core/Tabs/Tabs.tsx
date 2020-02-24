import React from "react";
import styles from "./tabs.module.css";
import classNames from "classnames";
import { Button } from "..";

type TabsProps = {
  children: React.ReactNode;
  activeId: string;
  onSelected: (id: string) => void;
  className?: string;
};

export const Tabs = React.memo((props: TabsProps) => {
  const { children, activeId, onSelected, className } = props;
  const childrenArray = React.Children.toArray(children).filter(
    Boolean
  ) as ReturnType<typeof Tab>[];
  return (
    <div className={className}>
      <div className={styles.tabs}>
        <div className={styles.titles}>
          {childrenArray.map(child => {
            if (child) {
              const { title, id } = child.props;
              const isActive = activeId === id;
              return (
                <Button
                  isLink={true}
                  className={
                    isActive
                      ? classNames(styles.tab, styles.active)
                      : styles.tab
                  }
                  onClick={() => onSelected(id)}
                  key={id}
                >
                  {title}
                </Button>
              );
            } else return <></>;
          })}
        </div>
      </div>
      {childrenArray.find(child => child?.props.id === activeId)}
    </div>
  );
});

type TabProps = {
  children: React.ReactNode;
  id: string;
  title: string;
};

export const Tab = React.memo((props: TabProps) => {
  const { children } = props;

  return <div>{children} </div>;
});
