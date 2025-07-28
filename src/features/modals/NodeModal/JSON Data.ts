function updateJSONData(updateNodeData){
  jsonData[updateNodeData.id] = updatedNodeData.value;
  renderJSON(jsonData);
}