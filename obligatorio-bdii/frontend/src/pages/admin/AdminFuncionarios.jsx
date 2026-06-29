import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, TextField,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton,
  Stack, Chip, MenuItem, Menu, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import DevicesIcon from '@mui/icons-material/Devices';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import { listarFuncionarios, buscarUsuarios, getAsignaciones, asignarSector, desasignarSector, listarDispositivosFuncionario, listarTodosDispositivos, crearDispositivo, asignarDispositivoExistente, eliminarDispositivo } from '../../api/admin';
import { ascenderFuncionario } from '../../api/usuarios';
import { listarEventos } from '../../api/eventos';
import { getSectoresAdmin } from '../../api/eventos';

function AsignacionDialog({ open, funcionario, onClose }) {
  const [asignaciones, setAsignaciones] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [selectedEvento, setSelectedEvento] = useState('');
  const [sectoresEvento, setSectoresEvento] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!funcionario) return;
    setLoading(true);
    try {
      const [asigs, evs] = await Promise.all([
        getAsignaciones(funcionario.mail),
        listarEventos(),
      ]);
      setAsignaciones(asigs);
      setEventos(evs.filter(e => new Date(e.fecha_hora) > new Date()));
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [funcionario]);

  useEffect(() => {
    if (open) cargar();
  }, [open, cargar]);

  const handleEventoChange = async (idEvento) => {
    setSelectedEvento(idEvento);
    setSelectedSector('');
    if (!idEvento) { setSectoresEvento([]); return; }
    try {
      const secs = await getSectoresAdmin(parseInt(idEvento));
      setSectoresEvento(secs.filter(s => s.habilitado));
    } catch {
      setSectoresEvento([]);
    }
  };

  const handleAsignar = async () => {
    if (!selectedEvento || !selectedSector) return;
    const ev = eventos.find(e => e.id_evento === parseInt(selectedEvento));
    if (!ev) return;
    setError('');
    try {
      const result = await asignarSector(funcionario.mail, {
        id_evento: ev.id_evento,
        id_estadio: ev.id_estadio,
        codigo_sector: selectedSector,
      });
      setAsignaciones(result);
      setSelectedSector('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al asignar');
    }
  };

  const handleDesasignar = async (a) => {
    const confirmar = window.confirm(
      `¿Está seguro de que desea quitar la asignación del sector ${a.codigo_sector}?`
    );

    if (!confirmar) return;

    try {
      await desasignarSector(
        funcionario.mail,
        a.id_evento,
        a.id_estadio,
        a.codigo_sector
      );

      setAsignaciones(prev =>
        prev.filter(
          item =>
            !(
              item.id_evento === a.id_evento &&
              item.codigo_sector === a.codigo_sector
            )
        )
      );
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al desasignar');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography fontWeight={500} fontSize={15}>
          Asignar sectores — {funcionario?.mail}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        {loading ? (
          <Typography fontSize={13} color="text.disabled" py={4} textAlign="center">Cargando...</Typography>
        ) : (
          <>
            <Typography fontSize={12} fontWeight={500} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1}>
              Sectores asignados actualmente
            </Typography>

            {asignaciones.length === 0 ? (
              <Typography fontSize={13} color="text.disabled" mb={2}>Sin asignaciones</Typography>
            ) : (
              <Stack gap={0.75} mb={2}>
                {asignaciones.map(a => (
                  <Paper key={`${a.id_evento}-${a.codigo_sector}`} elevation={0}
                    sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography fontSize={13} fontWeight={500}>
                        {a.evento_local}{a.evento_visitante ? ` vs. ${a.evento_visitante}` : ''}
                      </Typography>
                      <Typography fontSize={12} color="text.secondary">
                        {a.estadio_nombre} — Sector {a.codigo_sector}
                      </Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleDesasignar(a)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}

            <Typography fontSize={12} fontWeight={500} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1}>
              Asignar nuevo sector
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                select size="small" fullWidth
                label="Evento"
                value={selectedEvento}
                onChange={e => handleEventoChange(e.target.value)}
              >
                {eventos.map(ev => (
                  <MenuItem key={ev.id_evento} value={ev.id_evento}>
                    {ev.equipo_local}{ev.equipo_visitante ? ` vs. ${ev.equipo_visitante}` : ''} — {new Date(ev.fecha_hora).toLocaleDateString()}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" fullWidth
                label="Sector"
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
                disabled={!selectedEvento}
              >
                {sectoresEvento.map(s => (
                  <MenuItem key={s.codigo} value={s.codigo}>
                    {s.codigo} — ${s.costo} ({s.disponibles} disp.)
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="outlined" size="small"
                onClick={handleAsignar}
                disabled={!selectedEvento || !selectedSector}
                sx={{ fontSize: 12, flexShrink: 0 }}
              >
                Asignar
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small" sx={{ fontSize: 13 }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

function DispositivoDialog({ open, funcionario, onClose }) {
  const [dispositivos, setDispositivos] = useState([]);
  const [mode, setMode] = useState(''); // '' | 'nuevo' | 'existente'
  const [nuevoIdentificador, setNuevoIdentificador] = useState('');
  const [todosDispositivos, setTodosDispositivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargarDispositivos = useCallback(async () => {
    if (!funcionario) return;
    setLoading(true);
    try {
      const data = await listarDispositivosFuncionario(funcionario.mail);
      setDispositivos(data);
    } catch {
      setError('Error al cargar dispositivos');
    } finally {
      setLoading(false);
    }
  }, [funcionario]);

  useEffect(() => {
    if (open) {
      setMode('');
      setNuevoIdentificador('');
      setError('');
      cargarDispositivos();
    }
  }, [open, cargarDispositivos]);

  const handleRegistrarNuevo = async () => {
    if (!nuevoIdentificador.trim()) return;
    setError('');
    try {
      const result = await crearDispositivo(funcionario.mail, { identificador: nuevoIdentificador.trim() });
      setDispositivos(result);
      setNuevoIdentificador('');
      setMode('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al registrar dispositivo');
    }
  };

  const handleSeleccionarExistente = async () => {
    setError('');
    try {
      const data = await listarTodosDispositivos();
      setTodosDispositivos(data);
      setMode('existente');
    } catch {
      setError('Error al cargar dispositivos existentes');
    }
  };

  const handleAsignarExistente = async (d) => {
    setError('');
    try {
      const result = await asignarDispositivoExistente(funcionario.mail, {
        identificador: d.identificador,
        mail_origen: d.mail_funcionario,
      });
      setDispositivos(result);
      setMode('');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al asignar dispositivo');
    }
  };

  const handleEliminar = async (identificador) => {
    const confirmar = window.confirm(`¿Está seguro de eliminar el dispositivo ${identificador}?`);
    if (!confirmar) return;
    try {
      const result = await eliminarDispositivo(funcionario.mail, identificador);
      setDispositivos(result);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al eliminar dispositivo');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography fontWeight={500} fontSize={15}>
          Dispositivos — {funcionario?.mail}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

        {loading ? (
          <Typography fontSize={13} color="text.disabled" py={4} textAlign="center">Cargando...</Typography>
        ) : (
          <>
            {/* Dispositivos actuales */}
            <Typography fontSize={12} fontWeight={500} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={1}>
              Dispositivos asignados ({dispositivos.length})
            </Typography>

            {dispositivos.length === 0 ? (
              <Typography fontSize={13} color="text.disabled" mb={2}>Sin dispositivos asignados</Typography>
            ) : (
              <Stack gap={0.75} mb={2}>
                {dispositivos.map(d => (
                  <Paper key={d.identificador} elevation={0}
                    sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DevicesIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography fontSize={13} fontWeight={500}>{d.identificador}</Typography>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => handleEliminar(d.identificador)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* Acciones */}
            {mode === '' && (
              <Stack gap={1}>
                <Button
                  variant="outlined" size="small"
                  startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                  onClick={() => setMode('nuevo')}
                  sx={{ fontSize: 12, justifyContent: 'flex-start' }}
                >
                  Registrar nuevo dispositivo
                </Button>
                <Button
                  variant="outlined" size="small"
                  startIcon={<DeviceHubIcon sx={{ fontSize: 16 }} />}
                  onClick={handleSeleccionarExistente}
                  sx={{ fontSize: 12, justifyContent: 'flex-start' }}
                >
                  Seleccionar dispositivo existente
                </Button>
              </Stack>
            )}

            {mode === 'nuevo' && (
              <Box>
                <Typography fontSize={12} fontWeight={500} color="text.secondary" mb={1}>
                  Nuevo dispositivo
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    size="small" fullWidth
                    label="Identificador"
                    placeholder="Ej: DISP-006"
                    value={nuevoIdentificador}
                    onChange={e => setNuevoIdentificador(e.target.value)}
                    sx={{ '& .MuiInputBase-input': { fontSize: 13 } }}
                  />
                  <Button
                    variant="contained" size="small"
                    onClick={handleRegistrarNuevo}
                    disabled={!nuevoIdentificador.trim()}
                    sx={{ fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    Registrar
                  </Button>
                </Box>
              </Box>
            )}

            {mode === 'existente' && (
              <Box>
                <Typography fontSize={12} fontWeight={500} color="text.secondary" mb={1}>
                  Dispositivos en el sistema
                </Typography>
                {todosDispositivos.length === 0 ? (
                  <Typography fontSize={13} color="text.disabled">No hay dispositivos en el sistema</Typography>
                ) : (
                  <Stack gap={0.75} sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {todosDispositivos.map(d => (
                      <Paper key={`${d.mail_funcionario}-${d.identificador}`} elevation={0}
                        sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      >
                        <Box>
                          <Typography fontSize={13} fontWeight={500}>{d.identificador}</Typography>
                          <Typography fontSize={11} color="text.disabled">Actual dueño: {d.mail_funcionario}</Typography>
                        </Box>
                        <Button
                          size="small" variant="outlined"
                          disabled={d.mail_funcionario === funcionario?.mail}
                          onClick={() => handleAsignarExistente(d)}
                          sx={{ fontSize: 11, flexShrink: 0 }}
                        >
                          {d.mail_funcionario === funcionario?.mail ? 'Ya asignado' : 'Asignar'}
                        </Button>
                      </Paper>
                    ))}
                  </Stack>
                )}
                <Button size="small" sx={{ fontSize: 12, mt: 1 }} onClick={() => setMode('')}>
                  Volver
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small" sx={{ fontSize: 13 }}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

function AdminFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [ascenderMail, setAscenderMail] = useState('');
  const [nroLegajo, setNroLegajo] = useState('');

  const [asignando, setAsignando] = useState(null);
  const [dispositivoAnchor, setDispositivoAnchor] = useState(null);
  const [dispositivoFuncionario, setDispositivoFuncionario] = useState(null);
  const [dispositivoDialogOpen, setDispositivoDialogOpen] = useState(false);

  const cargarFuncionarios = useCallback(async () => {
    try {
      const data = await listarFuncionarios();
      setFuncionarios(data);
    } catch {
      setError('Error al cargar funcionarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarFuncionarios();
  }, [cargarFuncionarios]);

  useEffect(() => {
    if (!busqueda.trim()) { setResultadosBusqueda([]); return; }
    const timer = setTimeout(async () => {
      try {
        setBuscando(true);
        const data = await buscarUsuarios(busqueda);
        setResultadosBusqueda(data);
      } catch {
        setResultadosBusqueda([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const handleAscender = async (mail) => {
    if (!nroLegajo.trim() || !mail) return;
    try {
      await ascenderFuncionario(mail, nroLegajo.trim());
      setAscenderMail('');
      setNroLegajo('');
      setBusqueda('');
      setResultadosBusqueda([]);
      await cargarFuncionarios();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Error al ascender funcionario');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled' }}>
        <Typography>Cargando funcionarios...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '0.5px solid', borderColor: 'divider',
        px: 3, height: 52,
        display: 'flex', alignItems: 'center',
      }}>
        <Typography fontWeight={500} fontSize={15}>Funcionarios</Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }} onClose={() => setError('')}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Funcionarios activos', val: funcionarios.length },
          ].map((s, i) => (
            <Paper key={i} elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, p: 1.75 }}>
              <Typography fontSize={11} color="text.disabled" textTransform="uppercase" letterSpacing={0.5} mb={0.75}>
                {s.label}
              </Typography>
              <Typography fontWeight={500} fontSize={22}>{s.val}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Buscador y ascenso */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, mb: 2.5 }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '0.5px solid', borderColor: 'divider' }}>
            <Typography fontWeight={500} fontSize={13}>Ascender usuario a funcionario</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <TextField
              size="small" fullWidth
              placeholder="Buscar usuario por email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              sx={{ mb: 1.5, '& .MuiInputBase-input': { fontSize: 13 } }}
            />

            {buscando && <Typography fontSize={13} color="text.disabled" mb={1}>Buscando...</Typography>}

            {resultadosBusqueda.map(u => (
              <Paper key={u.mail} elevation={0} sx={{
                border: '0.5px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25, mb: 0.75,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Box>
                  <Typography fontSize={13} fontWeight={500}>{u.mail}</Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {u.tipo_doc} {u.nro_doc} — {u.role === 'funcionario' ? 'Ya es funcionario' : u.role === 'administrador' ? 'Es administrador' : 'Usuario general'}
                  </Typography>
                </Box>
                {u.role === 'usuario_general' && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                    <TextField
                      size="small" placeholder="Nro. legajo"
                      value={ascenderMail === u.mail ? nroLegajo : ''}
                      onChange={e => { setAscenderMail(u.mail); setNroLegajo(e.target.value); }}
                      sx={{ width: 140, '& .MuiInputBase-input': { fontSize: 12 } }}
                    />
                    <Button
                      size="small" variant="contained"
                      disabled={ascenderMail !== u.mail || !nroLegajo.trim()}
                      onClick={() => handleAscender(u.mail)}
                      sx={{ fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      Ascender
                    </Button>
                  </Box>
                )}
                {u.role !== 'usuario_general' && (
                  <Chip label={u.role} size="small" sx={{ fontSize: 11 }} />
                )}
              </Paper>
            ))}

            {resultadosBusqueda.length === 0 && busqueda.trim() && !buscando && (
              <Typography fontSize={13} color="text.disabled" textAlign="center" py={2}>
                No se encontraron usuarios
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Tabla de funcionarios */}
        <Paper elevation={0} sx={{ border: '0.5px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            px: 2, py: 1.5,
            borderBottom: '0.5px solid', borderColor: 'divider',
          }}>
            <Typography fontWeight={500} fontSize={13}>Funcionarios registrados</Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  {['Email', 'Documento', 'Legajo', 'Fecha registro', ''].map(h => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 500, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {funcionarios.map(f => (
                  <TableRow key={f.mail} sx={{ '&:hover': { bgcolor: 'background.default' } }}>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{f.mail}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {f.tipo_doc} {f.nro_doc}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{f.nro_legajo}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {f.fecha_registro ? new Date(f.fecha_registro).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small" variant="outlined"
                        startIcon={<AssignmentIcon sx={{ fontSize: 14 }} />}
                        onClick={() => setAsignando(f)}
                        sx={{ fontSize: 12, mr: 1 }}
                      >
                        Sectores
                      </Button>
                      <Button
                        size="small" variant="outlined"
                        startIcon={<DevicesIcon sx={{ fontSize: 14 }} />}
                        onClick={(e) => { setDispositivoAnchor(e.currentTarget); setDispositivoFuncionario(f); }}
                        sx={{ fontSize: 12 }}
                      >
                        Dispositivo
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {funcionarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.disabled', fontSize: 13 }}>
                      No hay funcionarios registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {asignando && (
        <AsignacionDialog
          open={!!asignando}
          funcionario={asignando}
          onClose={() => setAsignando(null)}
        />
      )}

      <Menu
        anchorEl={dispositivoAnchor}
        open={!!dispositivoAnchor}
        onClose={() => setDispositivoAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem dense sx={{ fontSize: 13 }} onClick={() => { setDispositivoAnchor(null); setDispositivoDialogOpen(true); }}>
          <AddIcon sx={{ fontSize: 16, mr: 1 }} /> Asignar dispositivo
        </MenuItem>
      </Menu>

      {dispositivoFuncionario && (
        <DispositivoDialog
          open={dispositivoDialogOpen}
          funcionario={dispositivoFuncionario}
          onClose={() => { setDispositivoDialogOpen(false); setDispositivoFuncionario(null); }}
        />
      )}
    </Box>
  );
}

export default AdminFuncionarios;
