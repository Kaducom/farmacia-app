import ModalScannerProduto from "./ModalScannerProduto";

/*
  Compatibilidade:
  O fluxo novo usa ModalScannerProduto como central pós-scan.
  Se alguma parte antiga ainda chamar ModalLoteScanner, ela recebe o mesmo visual e comportamento.
*/
function ModalLoteScanner(props) {
  return <ModalScannerProduto {...props} />;
}

export default ModalLoteScanner;
