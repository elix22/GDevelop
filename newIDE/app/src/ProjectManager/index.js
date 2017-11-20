import React, { Component } from 'react';
import { List, ListItem } from 'material-ui/List';
import TextField from 'material-ui/TextField';
import SearchBar from 'material-ui-search-bar';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconButton from 'material-ui/IconButton';
import ListIcon from '../UI/ListIcon';
import { makeAddItem } from '../UI/ListAddItem';
import Window from '../Utils/Window';
import IconMenu from '../UI/Menu/IconMenu';
import VariablesEditorDialog from '../VariablesList/VariablesEditorDialog';
import ProjectPropertiesDialog from './ProjectPropertiesDialog';
import {
  enumerateLayouts,
  enumerateExternalEvents,
  enumerateExternalLayouts,
  filterProjectItemsList,
} from './EnumerateProjectItems';

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    flex: 1,
    overflowY: 'scroll',
    padding: 0,
  },
  item: {
    borderBottom: '1px solid #e0e0e0', //TODO: Use theme color instead
  },
  projectStructureItem: {
    backgroundColor: '#f7f7f7', //TODO: Use theme color instead
    borderBottom: '1px solid #e0e0e0', //TODO: Use theme color instead
  },
  projectStructureItemNestedList: {
    padding: 0,
  },
  itemName: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  itemTextField: {
    top: -16,
  },
};

const ProjectStructureItem = props => (
  <ListItem
    style={styles.projectStructureItem}
    nestedListStyle={styles.projectStructureItemNestedList}
    {...props}
  />
);

class Item extends Component {
  componentDidUpdate(prevProps) {
    if (!prevProps.editingName && this.props.editingName) {
      setTimeout(() => {
        if (this.textField) this.textField.focus();
      }, 100);
    }
  }

  _onContextMenu = event => {
    if (this._iconMenu) this._iconMenu.open(event);
  };

  render() {
    const rightIconButton = this.props.rightIconButton || (
      <IconMenu
        ref={iconMenu => (this._iconMenu = iconMenu)}
        iconButtonElement={
          <IconButton
            onClick={e =>
              e.stopPropagation() /*Prevent bubbling the event to ListItem*/}
          >
            <MoreVertIcon />
          </IconButton>
        }
        menuTemplate={[
          {
            label: 'Edit',
            click: () => this.props.onEdit(),
          },
          {
            label: 'Rename',
            click: () => this.props.onEditName(),
          },
          {
            label: 'Delete',
            click: () => this.props.onDelete(),
          },
        ]}
      />
    );
    const label = this.props.editingName ? (
      <TextField
        id="rename-item-field"
        ref={textField => (this.textField = textField)}
        defaultValue={this.props.primaryText}
        onBlur={e => this.props.onRename(e.target.value)}
        onKeyPress={event => {
          if (event.charCode === 13) {
            // enter key pressed
            this.textField.blur();
            this.props.onRename(event.target.value);
          }
        }}
        fullWidth
        style={styles.itemTextField}
      />
    ) : (
      <div style={styles.itemName}>{this.props.primaryText}</div>
    );

    return (
      <ListItem
        style={{ ...styles.item, ...this.props.style }}
        onContextMenu={this._onContextMenu}
        primaryText={label}
        rightIconButton={rightIconButton}
        onClick={this.props.onEdit}
      />
    );
  }
}

const AddItem = makeAddItem(ListItem);

export default class ProjectManager extends React.Component {
  state = {
    renamedItemKind: null,
    renamedItemName: '',
    searchText: '',
  };

  _renderMenu() {
    // If there is already a main menu (as the native one made with
    // Electron), don't show it in the Project Manager.
    if (Window.hasMainMenu()) return null;

    return (
      <ProjectStructureItem
        primaryText="Menu"
        leftIcon={<ListIcon src="res/ribbon_default/new32.png" />}
        initiallyOpen={true}
        primaryTogglesNestedList={true}
        autoGenerateNestedIndicator={true}
        nestedItems={[
          <ListItem
            key="save"
            primaryText="Save"
            leftIcon={<ListIcon src="res/ribbon_default/save32.png" />}
            onTouchTap={() => this.props.onSaveProject()}
          />,
          <ListItem
            key="close"
            primaryText="Close"
            leftIcon={<ListIcon src="res/ribbon_default/close32.png" />}
            onTouchTap={() => this.props.onCloseProject()}
          />,
          <ListItem
            key="export"
            primaryText="Export"
            leftIcon={<ListIcon src="res/ribbon_default/export32.png" />}
            onTouchTap={() => this.props.onExportProject()}
          />,
        ]}
      />
    );
  }

  _onEditName = (kind, name) => {
    this.setState({
      renamedItemKind: kind,
      renamedItemName: name,
    });
  };

  render() {
    const { project } = this.props;
    const { renamedItemKind, renamedItemName, searchText } = this.state;

    const forceOpen = searchText !== '' ? true : undefined;

    return (
      <div style={styles.container}>
        <List style={styles.list}>
          {this._renderMenu()}
          {/* <ProjectStructureItem
            primaryText="Resources"
            leftIcon={<ListIcon src="res/ribbon_default/image32.png" />}
          /> */}
          <ProjectStructureItem
            primaryText="Game settings"
            leftIcon={
              <ListIcon src="res/ribbon_default/projectManager32.png" />
            }
            initiallyOpen={true}
            primaryTogglesNestedList={true}
            autoGenerateNestedIndicator={true}
            nestedItems={[
              <ListItem
                key="properties"
                primaryText="Properties"
                leftIcon={<ListIcon src="res/ribbon_default/editprop32.png" />}
                onTouchTap={() => this.setState({ projectPropertiesDialogOpen: true })}
              />,
              <ListItem
                key="global-variables"
                primaryText="Global variables"
                leftIcon={<ListIcon src="res/ribbon_default/editname32.png" />}
                onTouchTap={() => this.setState({ variablesEditorOpen: true })}
              />,
            ]}
          />
          <ProjectStructureItem
            primaryText="Scenes"
            leftIcon={<ListIcon src="res/ribbon_default/sceneadd32.png" />}
            initiallyOpen={true}
            open={forceOpen}
            primaryTogglesNestedList={true}
            autoGenerateNestedIndicator={!forceOpen}
            nestedItems={filterProjectItemsList(
              enumerateLayouts(project),
              searchText
            )
              .map((layout, i) => {
                const name = layout.getName();
                return (
                  <Item
                    key={i}
                    primaryText={name}
                    editingName={
                      renamedItemKind === 'layout' && renamedItemName === name
                    }
                    onEdit={() => this.props.onOpenLayout(name)}
                    onDelete={() => this.props.onDeleteLayout(layout)}
                    onRename={newName => {
                      this.props.onRenameLayout(name, newName);
                      this._onEditName(null, '');
                    }}
                    onEditName={() => this._onEditName('layout', name)}
                  />
                );
              })
              .concat(
                <AddItem
                  key={'add-scene'}
                  onClick={this.props.onAddLayout}
                  primaryText="Click to add a scene"
                />
              )}
          />
          <ProjectStructureItem
            primaryText="External events"
            leftIcon={
              <ListIcon src="res/ribbon_default/externalevents32.png" />
            }
            initiallyOpen={false}
            open={forceOpen}
            primaryTogglesNestedList={true}
            autoGenerateNestedIndicator={!forceOpen}
            nestedItems={filterProjectItemsList(
              enumerateExternalEvents(project),
              searchText
            )
              .map((externalEvents, i) => {
                const name = externalEvents.getName();
                return (
                  <Item
                    key={i}
                    primaryText={name}
                    editingName={
                      renamedItemKind === 'external-events' &&
                      renamedItemName === name
                    }
                    onEdit={() => this.props.onOpenExternalEvents(name)}
                    onDelete={() =>
                      this.props.onDeleteExternalEvents(externalEvents)}
                    onRename={newName => {
                      this.props.onRenameExternalEvents(name, newName);
                      this._onEditName(null, '');
                    }}
                    onEditName={() => this._onEditName('external-events', name)}
                  />
                );
              })
              .concat(
                <AddItem
                  key={'add-external-events'}
                  primaryText="Click to add external events"
                  onClick={this.props.onAddExternalEvents}
                />
              )}
          />
          <ProjectStructureItem
            primaryText="External layouts"
            leftIcon={
              <ListIcon src="res/ribbon_default/externallayout32.png" />
            }
            initiallyOpen={false}
            open={forceOpen}
            primaryTogglesNestedList={true}
            autoGenerateNestedIndicator={!forceOpen}
            nestedItems={filterProjectItemsList(
              enumerateExternalLayouts(project),
              searchText
            )
              .map((externalLayout, i) => {
                const name = externalLayout.getName();
                return (
                  <Item
                    key={i}
                    primaryText={name}
                    editingName={
                      renamedItemKind === 'external-layout' &&
                      renamedItemName === name
                    }
                    onEdit={() => this.props.onOpenExternalLayout(name)}
                    onDelete={() =>
                      this.props.onDeleteExternalLayout(externalLayout)}
                    onRename={newName => {
                      this.props.onRenameExternalLayout(name, newName);
                      this._onEditName(null, '');
                    }}
                    onEditName={() => this._onEditName('external-layout', name)}
                  />
                );
              })
              .concat(
                <AddItem
                  key={'add-external-layout'}
                  primaryText="Click to add an external layout"
                  onClick={this.props.onAddExternalLayout}
                />
              )}
          />
        </List>
        <SearchBar
          value={searchText}
          onRequestSearch={() => {}}
          onChange={text =>
            this.setState({
              searchText: text,
            })}
        />
        {this.state.variablesEditorOpen && (
          <VariablesEditorDialog
            open={this.state.variablesEditorOpen}
            variablesContainer={project.getVariables()}
            onCancel={() => this.setState({ variablesEditorOpen: false })}
            onApply={() => this.setState({ variablesEditorOpen: false })}
            emptyExplanationMessage="Global variables are variables that are shared amongst all the scenes of the game."
            emptyExplanationSecondMessage="For example, you can have a variable called UnlockedLevelsCount representing the number of levels unlocked by the player."
          />
        )}
        {this.state.projectPropertiesDialogOpen && (
          <ProjectPropertiesDialog
            open={this.state.projectPropertiesDialogOpen}
            project={project}
            onClose={() =>
              this.setState({ projectPropertiesDialogOpen: false })}
            onApply={() =>
              this.setState({ projectPropertiesDialogOpen: false })}
          />
        )}
      </div>
    );
  }
}
